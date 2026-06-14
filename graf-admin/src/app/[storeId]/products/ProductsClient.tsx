'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Button, Modal, Spinner } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import api from '@/utils/axios';
import { ProductPayload, SelectOption, FilterParams } from '@/types/product';
import { Product, Tax, Discount, Category } from '@/types';
import ProductForm from './ProductForm';
import ExcelHandler from './ExcelHandler';
import DraggableProductTable from './DraggableProductTable';
import VariationModal from './VariationModal';
import FilterSection from './FilterSection';
import { useDispatch } from 'react-redux';
import { setProducts as setReduxProducts, deleteProduct } from '@/redux/products';
import { addNotification } from '@/redux/ui';
import { FaPlus } from 'react-icons/fa';

export default function ProductsClient() {
  const { storeId } = useParams() as { storeId: string };
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [imagesFiles, setImagesFiles] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTaxes, setSelectedTaxes] = useState<number[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [stockEdits, setStockEdits] = useState<{ [id: number]: string }>({});
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [parentProductForVariation, setParentProductForVariation] = useState<Product | null>(null);
  const [filterForm, setFilterForm] = useState<FilterParams>({
    limit: 1000,
    offset: 0
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterParams>({
    limit: 1000,
    offset: 0
  });

  const dispatch = useDispatch();

  const handleImagesChange = useCallback((files: File[]) => {
    setImagesFiles(files);
  }, []);

  const handlePreviewsChange = useCallback((previews: string[]) => {
    setImagesPreviews(previews);
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLongDescription('');
    setBasePrice('');
    setStock('');
    setSku('');
    setImagesFiles([]);
    setImagesPreviews([]);
    setSelectedTaxes([]);
    setSelectedDiscounts([]);
    setSelectedCategories([]);
  };

  const fetchProducts = useCallback(async (filters: FilterParams = appliedFilters) => {
    try {
      setIsLoading(true);

      const queryParams = new URLSearchParams();
      queryParams.append('limit', filters.limit.toString());
      queryParams.append('offset', filters.offset.toString());
      queryParams.append('includeOutOfStock', 'true');

      if (filters.text) queryParams.append('text', filters.text);
      if (filters.minPrice !== undefined) queryParams.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) queryParams.append('maxPrice', filters.maxPrice.toString());
      if (filters.category !== undefined) queryParams.append('category', filters.category.toString());
      if (filters.discount !== undefined) queryParams.append('discount', filters.discount.toString());
      if (filters.exist !== undefined) queryParams.append('exist', filters.exist.toString());
      
      const response = await api.get(`/products/${storeId}?${queryParams.toString()}`);
      const fetchedProducts = response.data.data || response.data.products || [];
      
      setProducts(fetchedProducts);
      dispatch(setReduxProducts({ storeId, products: fetchedProducts }));
    } catch (error) {
      console.error('❌ FRONTEND - Error fetching products:', error);
      dispatch(addNotification({
        message: 'Error al cargar productos',
        color: 'danger'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, dispatch, storeId]);

  const fetchRelatedData = useCallback(async () => {
    try {
      const [taxesResponse, discountsResponse, categoriesResponse] = await Promise.all([
        api.get(`/taxes/${storeId}`),
        api.get(`/discounts/${storeId}`),
        api.get(`/categories/${storeId}`)
      ]);

      setTaxes(taxesResponse.data || []);
      setDiscounts(discountsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching related data:', error);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchProducts(appliedFilters);
      fetchRelatedData();
    }
  }, [storeId, appliedFilters, fetchProducts, fetchRelatedData]);

  const handleShowModal = (mode: 'create' | 'edit', product?: Product) => {
    setModalMode(mode);
    if (mode === 'edit' && product) {
      setCurrentProduct(product);
      setTitle(product.title);
      setDescription(product.description || '');
      setLongDescription(product.longDescription || '');

      const normalizeBasePrice = (val: number | string | undefined): string => {
        if (val === undefined || val === null) return '';
        const n = typeof val === 'string' ? parseFloat(val) : Number(val);
        if (isNaN(n)) return '';
        return String(Math.round(n));
      };
      setBasePrice(normalizeBasePrice(product.basePrice));

      setStock(product.stock?.toString() || '');
      setSku(product.sku || '');

      setImagesFiles([]);

      setImagesPreviews(product.images || []);

      setSelectedTaxes((product.taxes || []).map(t => t.id));

      setSelectedDiscounts((product.discounts || []).map(d => d.id));

      setSelectedCategories((product.categories || []).map(c => c.id));
    } else {
      setCurrentProduct(null);
      resetForm();
    }
    setShowModal(true);
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const { uploadMultipleImages } = await import('@/utils/imageUploadHelper');
    return uploadMultipleImages(files, 'products');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      dispatch(addNotification({
        message: 'El título es obligatorio',
        color: 'danger'
      }));
      return;
    }

    try {
      setIsUploading(true);

      const existingUrls = imagesPreviews.filter(url => 
        url.startsWith('http://') || url.startsWith('https://')
      );

      let newUploadedUrls: string[] = [];
      if (imagesFiles.length > 0) {
        newUploadedUrls = await uploadImages(imagesFiles);
      }

      const finalImageUrls = [...existingUrls, ...newUploadedUrls];

      const parsedPrice = parseInt(basePrice, 10) || 0;
      
      const productData: ProductPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        longDescription: longDescription.trim() || undefined,
        basePrice: parsedPrice,
        stock: stock ? parseInt(stock) : null,
        sku: sku.trim(),
        categoryIds: selectedCategories,
        taxIds: selectedTaxes,
        discountIds: selectedDiscounts,
        images: finalImageUrls,
      };

      if (modalMode === 'create') {
        const { data: created } = await api.post(`/products/${storeId}`, productData);
        dispatch(addNotification({ message: 'Producto creado exitosamente', color: 'success' }));
        const createdEntity = created?.id ? created : (created?.data?.id ? created.data : created?.product?.id ? created.product : created?.data?.product);
        if (createdEntity?.id) {
          const newList = [...products, createdEntity];
          setProducts(newList);
          dispatch(setReduxProducts({ storeId, products: newList }));
        } else {
          await fetchProducts(appliedFilters);
        }
      } else if (currentProduct) {
        const { data: updated } = await api.put(`/products/${storeId}/${currentProduct.id}`, productData);
        dispatch(addNotification({ message: 'Producto actualizado exitosamente', color: 'success' }));
        const updatedEntity = updated?.id ? updated : (updated?.data?.id ? updated.data : updated?.product?.id ? updated.product : updated?.data?.product);
        if (updatedEntity?.id) {

          const newList = products.map(p => p.id === updatedEntity.id ? updatedEntity : p);
          setProducts(newList);
          dispatch(setReduxProducts({ storeId, products: newList }));
        } else {
          await fetchProducts(appliedFilters);
        }
      }

      setShowModal(false);
      resetForm();
    } catch (error: unknown) {
      console.error('Error submitting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      dispatch(addNotification({
        message: errorMessage || 'Error al guardar producto',
        color: 'danger'
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (productId: number) => {
    setProductToDelete(productId);
    setShowDeleteModal(true);
  };

  const handleCreateVariation = (product: Product) => {
    setParentProductForVariation(product);
    setShowVariationModal(true);
  };

  const handleCloseVariationModal = () => {
    setShowVariationModal(false);
    setParentProductForVariation(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await api.delete(`/products/${storeId}/${productToDelete}`);
      dispatch(deleteProduct({ storeId, productId: productToDelete }));
      const message = response.data && typeof response.data === 'object' && 'enabled' in response.data && !response.data.enabled
        ? 'Producto deshabilitado exitosamente (tenía pedidos asociados)'
        : 'Producto eliminado exitosamente';
      dispatch(addNotification({
        message,
        color: 'success'
      }));
      fetchProducts(appliedFilters);
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      dispatch(addNotification({
        message: errorMessage || 'Error al eliminar producto',
        color: 'danger'
      }));
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const handleStockBlur = async (product: Product) => {
    const newStock = stockEdits[product.id];
    if (newStock === undefined || newStock === (product.stock?.toString() || '')) {
      return;
    }

    try {
      const stockValue = newStock === '' ? 0 : parseInt(newStock);
      if (stockValue < 0) {
        dispatch(addNotification({
          message: 'El stock no puede ser negativo',
          color: 'danger'
        }));
        setStockEdits(prev => ({ ...prev, [product.id]: product.stock?.toString() || '' }));
        return;
      }

      await api.patch(`/products/${storeId}/stock/${product.id}`, { 
        stock: stockValue,
        source: 'admin-panel',
        reason: 'Manual stock update from admin panel'
      });

      dispatch(addNotification({
        message: 'Stock actualizado exitosamente',
        color: 'success'
      }));

      fetchProducts(appliedFilters);
      setStockEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[product.id];
        return newEdits;
      });
    } catch (error: unknown) {
      console.error('Error updating stock:', error);
      dispatch(addNotification({
        message: 'Error al actualizar stock',
        color: 'danger'
      }));
      setStockEdits(prev => ({ ...prev, [product.id]: product.stock?.toString() || '' }));
    }
  };

  const handleUpdateCategoryOrder = async (productId: number, newOrder: number) => {
    try {
      if (!appliedFilters.category) {
        dispatch(addNotification({
          message: 'Debe filtrar por categoría para reordenar productos',
          color: 'warning'
        }));
        return;
      }
      await api.patch('/products/category-order/category', { 
        productId, 
        categoryId: appliedFilters.category,
        newOrder, 
        storeId 
      });

      fetchProducts(appliedFilters);
    } catch (error: unknown) {
      console.error('❌ FRONTEND - Error updating product order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      dispatch(addNotification({
        message: errorMessage || 'Error al actualizar orden en categoría',
        color: 'danger'
      }));
      throw error;
    }
  };

  const reorderEnabled = appliedFilters.category !== undefined;
  const activeCategoryName = reorderEnabled 
    ? categories.find(c => c.id === appliedFilters.category)?.name 
    : undefined;

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filterForm });
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterParams = {
      limit: 1000,
      offset: 0
    };
    setFilterForm(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  const taxesOptions: SelectOption[] = React.useMemo(() => 
    taxes.map(tax => ({
      value: tax.id,
      label: tax.name
    })), [taxes]
  );

  const discountsOptions: SelectOption[] = React.useMemo(() => 
    discounts.map(discount => ({
      value: discount.id,
      label: discount.name
    })), [discounts]
  );

  const categoriesOptions: SelectOption[] = React.useMemo(() => 
    categories.map(category => ({
      value: category.id,
      label: category.name
    })), [categories]
  );

  const LoadingOverlay = React.useCallback(() => (
    isLoading ? (
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 1000,
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    ) : null
  ), [isLoading]);

  return (
    <Container>
      <LoadingOverlay />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Productos</h1>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={() => handleShowModal('create')}
          >
            <FaPlus className="me-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <FilterSection
        categories={categories}
        filterForm={filterForm}
        setFilterForm={setFilterForm}
        handleApplyFilters={handleApplyFilters}
        handleClearFilters={handleClearFilters}
      />

      <ExcelHandler
        storeId={storeId}
        onImportComplete={() => fetchProducts(appliedFilters)}
      />

      <DraggableProductTable
        products={products}
        onEdit={(product) => handleShowModal('edit', product)}
        onDelete={handleDelete}
        onCreateVariation={handleCreateVariation}
        onUpdateCategoryOrder={handleUpdateCategoryOrder}
        stockEdits={stockEdits}
        onStockChange={(productId, value) => 
          setStockEdits(prev => ({ ...prev, [productId]: value }))
        }
        onStockBlur={handleStockBlur}
        reorderEnabled={reorderEnabled}
        activeCategoryName={activeCategoryName}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Crear Producto' : 'Editar Producto'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProductForm
            modalMode={modalMode}
            currentProduct={currentProduct}
            title={title}
            description={description}
            longDescription={longDescription}
            basePrice={basePrice}
            stock={stock}
            sku={sku}
            imagesPreviews={imagesPreviews}
            selectedTaxes={selectedTaxes}
            selectedDiscounts={selectedDiscounts}
            selectedCategories={selectedCategories}
            taxesOptions={taxesOptions}
            discountsOptions={discountsOptions}
            categoriesOptions={categoriesOptions}
            isUploading={isUploading}
            storeId={storeId}
            onSubmit={handleSubmit}
            onImagesChange={handleImagesChange}
            onPreviewsChange={handlePreviewsChange}
            onClose={() => setShowModal(false)}
            setTitle={setTitle}
            setDescription={setDescription}
            setLongDescription={setLongDescription}
            setBasePrice={setBasePrice}
            setStock={setStock}
            setSku={setSku}
            setSelectedTaxes={setSelectedTaxes}
            setSelectedDiscounts={setSelectedDiscounts}
            setSelectedCategories={setSelectedCategories}
            fetchProducts={() => fetchProducts(appliedFilters)}
          />
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres eliminar este producto?
          <br/><br/>
          <small className="text-muted">
            <strong>Nota:</strong> Si el producto tiene pedidos asociados, se deshabilitará en lugar de eliminarse completamente para preservar el historial de ventas.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {showVariationModal && parentProductForVariation && (
        <VariationModal
          show={showVariationModal}
          onHide={handleCloseVariationModal}
          storeId={storeId}
          parentProduct={parentProductForVariation}
          variationToEdit={null}
          fetchProducts={() => fetchProducts(appliedFilters)}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      )}
    </Container>
  );
}
