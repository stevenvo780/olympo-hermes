import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import api from '@/utils/axios';
import { Category } from '@/types';
import { ImportOperationStatus } from '@/types/product-excel';
import { addNotification } from '@/redux/ui';
import type { AppDispatch } from '@/redux/store';
import { getCurrentUserToken } from '@/utils/firebaseHelper';

interface CategoryExcelRow {
  id?: number;
  name: string;
  description?: string;
  parentId?: number;
  position?: number;
  imageUrl?: string;
}

interface CategoryImportResult {
  categoryName: string;
  row?: number;
  status: ImportOperationStatus;
  message: string;
  categoryId?: number;
  error?: unknown;
}

interface UseCategoryExcelHandlerProps {
  storeId: string;
  dispatch: AppDispatch;
  onImportComplete: () => void;
}

type ImportCategoriesResponse = {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  failed: number;
  results: CategoryImportResult[];
};

const categoryToExcelRow = (category: Category): CategoryExcelRow => {
  return {
    id: category.id,
    name: category.name,
    description: category.description || '',
    parentId: category.parent?.id,
    position: category.position || 0,
    imageUrl: category.imageUrl || ''
  };
};

function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  function walk(list: Category[]) {
    list.forEach(cat => {
      result.push(cat);
      if (cat.children) walk(cat.children);
    });
  }
  walk(cats);
  return result;
}

function validateCategoryHierarchy(
  rows: CategoryExcelRow[],
  currentCategories: Category[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allCategories = [...currentCategories];

  const processedMap = new Map<number, { name: string; parentId?: number }>();

  rows.forEach(row => {
    if (row.id) {
      processedMap.set(row.id, {
        name: row.name,
        parentId: row.parentId
      });
    }
  });

  for (const row of rows) {
    if (!row.id || !row.parentId) continue;

    if (row.id === row.parentId) {
      errors.push(`Categoría "${row.name}" no puede ser padre de sí misma`);
      continue;
    }

    let currentParentId: number | undefined = row.parentId;
    const visited = new Set<number>();
    let hasCircularRef = false;

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        hasCircularRef = true;
        break;
      }

      visited.add(currentParentId);

      if (currentParentId === row.id) {
        hasCircularRef = true;
        break;
      }

      const processedParent = processedMap.get(currentParentId);
      if (processedParent && processedParent.parentId !== undefined) {
        currentParentId = processedParent.parentId;
      } else {
        const existingParent = allCategories.find(c => c.id === currentParentId);
        currentParentId = existingParent?.parent?.id;
      }
    }

    if (hasCircularRef) {
      errors.push(`Referencia circular detectada para categoría "${row.name}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function useCategoryExcelHandler({
  storeId,
  dispatch,
  onImportComplete
}: UseCategoryExcelHandlerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Procesando...');
  const [importResults, setImportResults] = useState<CategoryImportResult[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSummary, setResultSummary] = useState({
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    deleted: 0
  });
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [deleteCategoriesNotInExcel] = useState(true);

  const fetchAllCategories = useCallback(async (): Promise<Category[]> => {
    try {
      const response = await api.get(`/categories/${storeId}`);
      const allCategories = response.data || [];
      const flattened = flattenCategories(allCategories);
      setLocalCategories(flattened);
      return flattened;
    } catch (error) {
      console.error('Error fetching all categories:', error);
      return [];
    }
  }, [storeId]);

  const handleExportExcel = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Exportando categorías a Excel...');
      const allCategories = await fetchAllCategories();
      if (!allCategories || allCategories.length === 0) {
        dispatch(addNotification({ message: 'No hay categorías para exportar', color: 'warning' }));
        return;
      }

      const dataForExcel = allCategories.map(category => categoryToExcelRow(category));

      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Categorías');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `categorias-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exportando categorías:', error);
      dispatch(addNotification({ message: 'Error al exportar categorías', color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllCategories, dispatch]);

  const handleImportExcel = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsLoading(true);
        setLoadingMessage('Validando archivo...');

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          dispatch(addNotification({
            message: 'El archivo es demasiado grande. Máximo permitido: 5MB',
            color: 'danger'
          }));
          setIsLoading(false);
          return;
        }

        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ];

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
          dispatch(addNotification({
            message: 'Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)',
            color: 'danger'
          }));
          setIsLoading(false);
          return;
        }

        setLoadingMessage('Importando categorías desde Excel...');
        const currentCategories = await fetchAllCategories();
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<CategoryExcelRow>(worksheet);

          if (rows.length === 0) {
            setIsLoading(false);
            dispatch(addNotification({
              message: 'El archivo Excel está vacío',
              color: 'danger'
            }));
            return;
          }

          const maxRows = 500;
          if (rows.length > maxRows) {
            setIsLoading(false);
            dispatch(addNotification({
              message: `Demasiadas filas en el archivo. Máximo permitido: ${maxRows}. Encontradas: ${rows.length}`,
              color: 'danger'
            }));
            return;
          }

          setLoadingMessage('Validando jerarquía de categorías...');
          const hierarchyValidation = validateCategoryHierarchy(rows, currentCategories);

          if (!hierarchyValidation.isValid) {
            setIsLoading(false);
            dispatch(addNotification({
              message: `Errores de validación: ${hierarchyValidation.errors.join(', ')}`,
              color: 'danger'
            }));
            return;
          }

          try {
            setLoadingMessage('Procesando importación masiva...');

            const importPayload = {
              rows: rows,
              deleteCategoriesNotInExcel: deleteCategoriesNotInExcel
            };
            
            // Asegurar token fresco antes de enviar payload pesado
            const token = await getCurrentUserToken();

            const response = await api.post<ImportCategoriesResponse>(
              `/categories/${storeId}/import-excel`,
              importPayload,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            const { created, updated, deleted, skipped, failed, results } = response.data;

            const frontendResults = results.map((result) => ({
              categoryName: result.categoryName,
              row: result.row,
              status: result.status,
              message: result.message,
              categoryId: result.categoryId,
              error: result.error,
            }));

            setImportResults(frontendResults);
            setResultSummary({
              total: rows.length,
              created,
              updated,
              skipped,
              failed,
              deleted
            });

            setIsLoading(false);

            setTimeout(() => {
              setShowResultModal(true);
            }, 300);

            dispatch(
              addNotification({
                message: `Importación de categorías completada: ${created} creadas, ${updated} actualizadas, ${skipped} sin cambios, ${deleted} eliminadas, ${failed} errores`,
                color: failed > 0 ? 'warning' : 'success'
              })
            );

            if (fileInputRef.current) fileInputRef.current.value = '';
            await fetchAllCategories();
            onImportComplete();

          } catch (error: unknown) {
            setIsLoading(false);
            const responseMessage =
              typeof error === 'object' &&
              error !== null &&
              'response' in error &&
              typeof (error as { response?: { data?: { message?: string } } }).response?.data
                ?.message === 'string'
                ? (error as { response?: { data?: { message?: string } } }).response!.data!.message
                : undefined;
            const errorMessage =
              responseMessage ||
              (typeof error === 'object' && error !== null && 'message' in error
                ? (error as { message?: string }).message
                : undefined) ||
              'Error desconocido';
            dispatch(addNotification({
              message: `Error durante la importación: ${errorMessage}`,
              color: 'danger'
            }));
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };

        onImportComplete();
        reader.readAsBinaryString(file);

      } catch (error: unknown) {
        setIsLoading(false);
        const errorMessage =
          (typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message
            : undefined) || 'Error desconocido';
        dispatch(addNotification({
          message: `Error durante la importación: ${errorMessage}`,
          color: 'danger'
        }));
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [fetchAllCategories, dispatch, storeId, deleteCategoriesNotInExcel, onImportComplete]
  );

  return {
    isLoading,
    loadingMessage,
    importResults,
    showResultModal,
    resultSummary,
    fileInputRef,
    setShowResultModal,
    handleExportExcel,
    handleImportExcel,
    localCategories
  };
}
