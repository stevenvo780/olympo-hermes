import { useRef, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import api from '@/utils/axios';
import { addNotification } from '@/redux/ui';
import { Product } from '@/types';

interface ImportResult {
  sku: string;
  title: string;
  status: 'created' | 'updated' | 'deleted' | 'skipped' | 'failed';
  message: string;
}

interface LookupItem {
  id: number;
  name: string;
}

interface LookupData {
  categories: LookupItem[];
  taxes: LookupItem[];
  discounts: LookupItem[];
}

interface UseExcelHandlerProps {
  storeId: string;
  dispatch: (action: { type: string; payload?: unknown }) => void;
  onImportComplete: () => void;
}

interface RowRecord { [key: string]: unknown }

export function useExcelHandler({
  storeId,
  dispatch,
  onImportComplete,
}: UseExcelHandlerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Procesando...');
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  const getImagesForExport = (images: string[] | null | undefined): string => {
    if (!images || !Array.isArray(images)) return '';

    return images.filter(url => typeof url === 'string' && url.trim() !== '').join('\n');
  };
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSummary, setResultSummary] = useState({
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    deleted: 0,
  });
  const [deleteProductsNotInExcel, setDeleteProductsNotInExcel] = useState(false);

  const fetchAllProducts = useCallback(async (): Promise<Product[]> => {
    try {
      const response = await api.get(`/products/${storeId}/excel/export`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching products for export:', error);

      try {
        const response = await api.get(`/products/${storeId}/all`);
        return response.data || [];
      } catch {
        return [];
      }
    }
  }, [storeId]);

  const fetchLookupData = useCallback(async () => {
    try {
      const response = await api.get(`/products/${storeId}/excel/lookup`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lookup data:', error);
      return { categories: [], taxes: [], discounts: [] };
    }
  }, [storeId]);

  const normalizeRowData = (row: Record<string, unknown>, lookupData: LookupData, rowIndex: number): {
    data: Record<string, unknown>;
    errors: string[];
  } => {
    const errors: string[] = [];
    const rowNum = rowIndex + 2;

    const namesToIds = (names: string, lookupArray: LookupItem[]): number[] => {
      if (!names || typeof names !== 'string') return [];

      const nameList = names
        .split(/[,\n]/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
      const ids: number[] = [];

      nameList.forEach(name => {
        const sanitizedName = name.replace(/[<>]/g, '').substring(0, 100);
        const item = lookupArray.find(item => 
          item.name.toLowerCase().trim() === sanitizedName.toLowerCase().trim()
        );
        if (item) {
          ids.push(item.id);
        }
      });

      return ids;
    };

    const sku = String(row['SKU'] || '').trim().substring(0, 50);
    if (!sku) {
      errors.push(`Fila ${rowNum}: SKU es requerido`);
    } else if (!/^[A-Za-z0-9-_\.]+$/.test(sku)) {
      errors.push(`Fila ${rowNum}: SKU contiene caracteres inválidos. Solo se permiten letras, números, guiones, guiones bajos y puntos`);
    }

    const title = String(row['Título'] || '').trim().substring(0, 200);
    if (!title) {
      errors.push(`Fila ${rowNum}: Título es requerido`);
    } else if (title.length < 2) {
      errors.push(`Fila ${rowNum}: Título debe tener al menos 2 caracteres`);
    }

    const basePrice = Number(row['Precio Base']);
    if (isNaN(basePrice) || basePrice < 0) {
      errors.push(`Fila ${rowNum}: Precio Base debe ser un número válido mayor o igual a 0`);
    } else if (basePrice > 999999999) {
      errors.push(`Fila ${rowNum}: Precio Base excede el límite máximo`);
    }

    const stock = row['Stock'] !== null && row['Stock'] !== undefined && row['Stock'] !== '' 
      ? Number(row['Stock']) 
      : null;
    
    if (stock !== null && (isNaN(stock) || stock < 0)) {
      errors.push(`Fila ${rowNum}: Stock debe ser un número válido mayor o igual a 0 o dejarse vacío`);
    } else if (stock !== null && stock > 999999) {
      errors.push(`Fila ${rowNum}: Stock excede el límite máximo`);
    }

    const imagesStr = String(row['Imágenes'] || '');
    let images: string[] = [];
    if (imagesStr) {
      const imageUrls = imagesStr
        .split(/[,\n|]/)
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const validUrls: string[] = [];

      imageUrls.forEach(url => {
        try {
          const urlObj = new URL(url);
          if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
            validUrls.push(url);
          }
        } catch {
          if (url.includes('.') && !url.includes('://')) {
            try {
              const urlWithProtocol = `https://${url}`;
              new URL(urlWithProtocol);
              validUrls.push(urlWithProtocol);
            } catch {
            }
          }
        }
      });

      images = validUrls;
    }

    const parentSku = String(row['SKU-Padre'] || '').trim().substring(0, 50);
    if (parentSku) {
      if (!/^[A-Za-z0-9-_\.]*$/.test(parentSku)) {
        errors.push(`Fila ${rowNum}: SKU-Padre contiene caracteres inválidos`);
      }
      if (parentSku === sku) {
        errors.push(`Fila ${rowNum}: SKU-Padre no puede ser el mismo que SKU`);
      }
    }

    const actionRaw = String(row['Acción'] || 'update').toLowerCase().trim();
    const action = ['create', 'crear'].includes(actionRaw) ? 'create' :
                   ['update', 'actualizar'].includes(actionRaw) ? 'update' :
                   ['delete', 'eliminar', 'borrar'].includes(actionRaw) ? 'delete' : 
                   'update';

    const data: Record<string, unknown> = {
      sku,
      title,
      description: String(row['Descripción'] || '').substring(0, 1000),
      basePrice: isNaN(basePrice) ? 0 : basePrice,
      stock: stock,
      categoryIds: namesToIds(String(row['Categorías'] || ''), lookupData.categories),
      taxIds: namesToIds(String(row['Impuestos'] || ''), lookupData.taxes),
      discountIds: namesToIds(String(row['Descuentos'] || ''), lookupData.discounts),
      images,
      parentSku,
      action: action as 'create' | 'update' | 'delete',
      enabled: row['Habilitado'] !== undefined ? 
        ['true', 'sí', 'si', '1', 'yes', true, 1].includes(String(row['Habilitado']).toLowerCase()) :
        true,
    };

    if (Object.prototype.hasOwnProperty.call(row, 'Descripción Larga')) {
      data.longDescription = String(row['Descripción Larga'] || '');
    }

    return { data, errors };
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setLoadingMessage('Validando archivo...');

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo permitido: 5MB');
      }

      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];

      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        throw new Error('Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)');
      }

      setLoadingMessage('Leyendo archivo Excel...');

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<RowRecord>(worksheet);

      if (rows.length === 0) {
        throw new Error('El archivo Excel está vacío');
      }

      const maxRows = 1000;
      if (rows.length > maxRows) {
        throw new Error(`Demasiadas filas en el archivo. Máximo permitido: ${maxRows}. Encontradas: ${rows.length}`);
      }

      setLoadingMessage('Obteniendo datos de referencia...');

      const lookupData = await fetchLookupData();

      setLoadingMessage('Procesando y validando filas...');

      const skuSet = new Set<string>();
      const duplicateSkus: string[] = [];
      rows.forEach((row: RowRecord) => {
        const sku = String(row['SKU'] || '').trim().toLowerCase();
        if (sku && skuSet.has(sku)) duplicateSkus.push(sku);
        if (sku) skuSet.add(sku);
      });
      const parentSkus = new Set<string>();
      rows.forEach((row: RowRecord) => {
        const parentSku = String(row['SKU-Padre'] || '').trim().toLowerCase();
        if (parentSku) parentSkus.add(parentSku);
      });

      const missingParents = Array.from(parentSkus).filter(parentSku => !skuSet.has(parentSku));
      if (missingParents.length > 0) {
        console.warn('SKUs padre no encontrados en el archivo:', missingParents);
      }

      const processedRows = rows.map((row, index) =>
        normalizeRowData(row as Record<string, unknown>, lookupData, index)
      );

      const allErrors = processedRows.flatMap(processed => processed.errors);

      if (allErrors.length > 0) {
        const errorMessage = `Errores de validación encontrados:\n${allErrors.slice(0, 5).join('\n')}${
          allErrors.length > 5 ? `\n... y ${allErrors.length - 5} errores más` : ''
        }\n\nSugerencia: Verifica que los nombres de categorías, impuestos y descuentos coincidan exactamente con los configurados en el sistema.`;

        throw new Error(errorMessage);
      }

      const normalizedRows = processedRows.map(processed => processed.data);

      setLoadingMessage('Enviando al servidor...');

      const response = await api.post(`/products/${storeId}/excel/import`, {
        rows: normalizedRows,
        deleteProductsNotInExcel
      });

      const { created, updated, deleted, skipped, failed, results } = response.data;

      setResultSummary({
        total: results.length,
        created,
        updated,
        deleted,
        skipped,
        failed,
      });

      setImportResults(results.map((result: ImportResult) => ({
        sku: result.sku,
        title: result.title || result.sku,
        status: result.status,
        message: result.message,
      })));

      setShowResultModal(true);
      onImportComplete();

      dispatch(addNotification({
        message: `Importación completada: ${created} creados, ${updated} actualizados, ${deleted} eliminados.`,
        color: 'success'
      }));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error importing Excel:', error);
      dispatch(addNotification({
        message: errorMessage,
        color: 'danger'
      }));
    } finally {
      setIsLoading(false);
      setLoadingMessage('Procesando...');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportExcel = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Exportando productos...');

      const [products, lookupData] = await Promise.all([
        fetchAllProducts(),
        fetchLookupData()
      ]);

      const idsToNames = (ids: number[], lookupArray: LookupItem[]): string => {
        if (!ids || ids.length === 0) return '';
        return ids.map(id => lookupArray.find(item => item.id === id)?.name)
          .filter(name => name)
          .join(', ');
      };

      const data = products.map((product) => {
        return {
          'SKU': product.sku || '',
          'Título': product.title,
          'Descripción': product.description || '',
          'Descripción Larga': product.longDescription || '',
          'Precio Base': product.basePrice,
          'Stock': product.stock !== null && product.stock !== undefined ? product.stock : '',
          'Categorías': idsToNames((product.categories || []).map(c => c.id), lookupData.categories),
          'Impuestos': idsToNames((product.taxes || []).map(t => t.id), lookupData.taxes),
          'Descuentos': idsToNames((product.discounts || []).map(d => d.id), lookupData.discounts),
          'Imágenes': getImagesForExport(product.images),
          'SKU-Padre': product.parent?.sku || '',
          'Habilitado': product.enabled !== false ? 'Sí' : 'No',
          'Acción': 'update'
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(data);
      const colWidths = [
        { wch: 15 },
        { wch: 40 },
        { wch: 50 },
        { wch: 70 },
        { wch: 12 },
        { wch: 10 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 60 },
        { wch: 15 },
        { wch: 8 },
        { wch: 10 },
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
      
      const fileName = `productos-${storeId}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      dispatch(addNotification({
        message: 'Excel exportado exitosamente con orden jerárquico',
        color: 'success'
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error exporting Excel:', error);
      dispatch(addNotification({
        message: `Error al exportar Excel: ${errorMessage}`,
        color: 'danger'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [storeId, fetchAllProducts, fetchLookupData, dispatch]);

  const generateExcelTemplate = useCallback(async () => {
    try {
      setIsLoading(true);
      const lookupData = await fetchLookupData();

      const templateData = [
        {
          'SKU': 'PROD-001',
          'Título': 'Producto Principal',
          'Descripción': 'Descripción del producto principal',
          'Descripción Larga': 'Descripción detallada con más información del producto',
          'Precio Base': 100,
          'Stock': 50,
          'Categorías': lookupData.categories.slice(0, 2).map((c: LookupItem) => c.name).join(', '),
          'Impuestos': lookupData.taxes.slice(0, 1).map((t: LookupItem) => t.name).join(', '),
          'Descuentos': '',
          'Imágenes': 'https://ejemplo.com/imagen1.jpg\nhttps://ejemplo.com/imagen2.jpg\nhttps://ejemplo.com/imagen3.jpg',
          'SKU-Padre': '',
          'Habilitado': 'Sí',
          'Acción': 'create'
        },
        {
          'SKU': 'PROD-001-ROJO',
          'Título': 'Variación Rojo',
          'Descripción': 'Variación en color rojo',
          'Descripción Larga': '',
          'Precio Base': 95,
          'Stock': 20,
          'Categorías': '',
          'Impuestos': '',
          'Descuentos': '',
          'Imágenes': 'https://ejemplo.com/rojo1.jpg\nhttps://ejemplo.com/rojo2.jpg',
          'SKU-Padre': 'PROD-001',
          'Habilitado': 'Sí',
          'Acción': 'create'
        },
        {
          'SKU': 'PROD-001-AZUL',
          'Título': 'Variación Azul',
          'Descripción': 'Variación en color azul',
          'Descripción Larga': '',
          'Precio Base': 95,
          'Stock': 15,
          'Categorías': '',
          'Impuestos': '',
          'Descuentos': '',
          'Imágenes': 'https://ejemplo.com/azul1.jpg',
          'SKU-Padre': 'PROD-001',
          'Habilitado': 'Sí',
          'Acción': 'create'
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const colWidths = [
        { wch: 15 },
        { wch: 40 },
        { wch: 50 },
        { wch: 70 },
        { wch: 12 },
        { wch: 10 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 60 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
      XLSX.writeFile(workbook, 'plantilla-productos-jerarquica.xlsx');

      dispatch(addNotification({
        message: 'Plantilla descargada con ejemplos de productos padre e hijos. Las imágenes se separan con saltos de línea.',
        color: 'success'
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error generating template:', error);
      dispatch(addNotification({
        message: `Error al generar plantilla: ${errorMessage}`,
        color: 'danger'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [fetchLookupData, dispatch]);

  return {
    isLoading,
    loadingMessage,
    importResults,
    showResultModal,
    resultSummary,
    fileInputRef,
    deleteProductsNotInExcel,
    setShowResultModal,
    setDeleteProductsNotInExcel,
    handleExportExcel,
    handleImportExcel,
    generateExcelTemplate,
  };
}
