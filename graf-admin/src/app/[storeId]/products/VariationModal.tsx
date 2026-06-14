import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { Product, Tax, Discount, Category } from '@/types';
import ImageUploader from '@/components/ImageUploader';
import Select, { MultiValue } from 'react-select';
import { SelectOption } from '@/types/product';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import api from '@/utils/axios';
import { storage } from '@/utils/firebase';
import { AxiosError } from 'axios';
import VariationSection from './VariationSection';
import { formatNumberWithCommas } from '@/utils/formatters';
import { getPriceRange } from '@/utils/productPrice';

interface VariationModalProps {
  show: boolean;
  onHide: () => void;
  storeId: string;
  parentProduct: Product;
  variationToEdit: Product | null;
  fetchProducts: () => void;
  taxesOptions: SelectOption[];
  discountsOptions: SelectOption[];
  categoriesOptions: SelectOption[];
}

export default function VariationModal({
  show,
  onHide,
  storeId,
  parentProduct,
  variationToEdit,
  fetchProducts,
  taxesOptions,
  discountsOptions,
  categoriesOptions
}: VariationModalProps) {
  const dispatch = useDispatch();
  const [variationData, setVariationData] = useState<Partial<Product>>({});
  const [selectedTaxes, setSelectedTaxes] = useState<number[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [imagesFiles, setImagesFiles] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleImagesChange = useCallback((files: File[]) => {
    setImagesFiles(files);
  }, []);

  const handlePreviewsChange = useCallback((previews: string[]) => {
    setImagesPreviews(previews);
  }, []);

  useEffect(() => {
    setErrors({});
    
    if (variationToEdit) {
      const loadVariationDetails = async (productId: number) => {
        setIsLoadingDetails(true);
        try {
          const response = await api.get<Product>(`/products/${storeId}/${productId}`);
          const productData = response.data;
          
          const normalizeBasePrice = (val: number | string | undefined): number => {
            if (val === undefined || val === null) return 0;
            const n = typeof val === 'string' ? parseFloat(val) : Number(val);
            return isNaN(n) ? 0 : Math.round(n);
          };

          setVariationData({
            ...productData,
            basePrice: normalizeBasePrice(productData.basePrice)
          });
          setSelectedTaxes((productData.taxes || []).map((tax: Tax) => tax.id));
          setSelectedDiscounts((productData.discounts || []).map((discount: Discount) => discount.id));
          setSelectedCategories((productData.categories || []).map((category: Category) => category.id));
          setImagesPreviews(productData.images || []);
        } catch (error) {
          console.error('Error al cargar detalles de la variación:', error);
          dispatch(addNotification({ 
            message: 'No se pudieron cargar los detalles completos de la variación', 
            color: 'danger' 
          }));
          
          const normalizeBasePrice = (val: number | string | undefined): number => {
            if (val === undefined || val === null) return 0;
            const n = typeof val === 'string' ? parseFloat(val) : Number(val);
            return isNaN(n) ? 0 : Math.round(n);
          };

          setVariationData({
            ...(variationToEdit || {}),
            basePrice: normalizeBasePrice(variationToEdit?.basePrice)
          });
          setSelectedTaxes((variationToEdit?.taxes || []).map(t => t.id));
          setSelectedDiscounts((variationToEdit?.discounts || []).map(d => d.id));
          setSelectedCategories((variationToEdit?.categories || []).map(c => c.id));
          setImagesPreviews(variationToEdit?.images || []);
        } finally {
          setIsLoadingDetails(false);
        }
      };
      loadVariationDetails(variationToEdit.id);
    } else {
      setVariationData({
        title: parentProduct.title || '',
        description: parentProduct.description || '',
        basePrice: parentProduct.basePrice || 0,
        stock: parentProduct.stock || null,
        sku: ''
      });
      setSelectedTaxes((parentProduct.taxes || []).map(t => t.id));
      setSelectedDiscounts((parentProduct.discounts || []).map(d => d.id));
      setSelectedCategories((parentProduct.categories || []).map(c => c.id));
      setImagesPreviews([]);
      setImagesFiles([]);
    }
  }, [variationToEdit, parentProduct, storeId, dispatch]);

  const uploadVariationImages = async (): Promise<string[]> => {
    if (imagesFiles.length > 0) {
      const urls = await Promise.all(
        imagesFiles.map(async (file) => {
          const fileRef = storage.ref(`/products/${storeId}/${file.name}-${Date.now()}`);
          await fileRef.put(file);
          return await fileRef.getDownloadURL();
        })
      );
      return urls;
    }
    return Promise.resolve(variationToEdit?.images || []);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!variationData.sku?.trim()) {
      newErrors.sku = 'El SKU es obligatorio';
    }
    
    if (selectedCategories.length === 0) {
      newErrors.categories = 'Debes seleccionar al menos una categoría';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const refreshParent = async () => {
    try {
      const { data } = await api.get(`/products/${storeId}/${parentProduct.id}`);
      const refreshed = data?.id ? data : (data?.product?.id ? data.product : data?.data?.product || data?.data);
      if (refreshed?.id) {
        fetchProducts();
      }
    } catch (e) {
      console.warn('No se pudo refrescar el producto padre', e);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      let finalImages = imagesPreviews;
      if (imagesFiles.length > 0) {
        try {
          finalImages = await uploadVariationImages();
        } catch (uploadError) {
          console.error('Error al subir imágenes:', uploadError);
          dispatch(addNotification({ 
            message: 'Error al subir imágenes. Guardando sin nuevas imágenes.',
            color: 'warning'
          }));
        }
      }
      
      const payload = {
        title: variationData.title,
        description: variationData.description,
        basePrice: variationData.basePrice,
        stock: variationData.stock,
        sku: variationData.sku,
        parentId: parentProduct.id,
        variationType: null,
        taxIds: selectedTaxes,
        discountIds: selectedDiscounts,
        categoryIds: selectedCategories,
        images: finalImages
      };
      
      let responseProduct: Product | null = null;
      if (variationToEdit) {
        const { data } = await api.put(`/products/${storeId}/${variationToEdit.id}`, payload);
        responseProduct = data;
        dispatch(addNotification({ message: 'Variación actualizada exitosamente', color: 'success' }));
      } else {
        const { data } = await api.post(`/products/${storeId}`, payload);
        responseProduct = data;
        dispatch(addNotification({ message: 'Variación creada exitosamente', color: 'success' }));
      }
      
      await refreshParent();

      try {
        if (responseProduct && responseProduct.id) {
          fetchProducts();
        } else {
          await fetchProducts();
        }
      } catch {
        await fetchProducts();
      }
      
      onHide();
    } catch (error: unknown) {
      console.error('Error al guardar la variación:', error);
      if (error instanceof Error) {
        console.error('Mensaje de error:', error.message);
      }
      const errorAxios = error as AxiosError;
      console.error('Respuesta del servidor:', errorAxios.response?.data);
      const data = errorAxios.response?.data as { message: string } | undefined;
      const errMsg = data?.message || 'Error al guardar la variación';
      dispatch(addNotification({ message: errMsg, color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {variationToEdit ? 'Editar Variación' : 'Crear Variación'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoadingDetails ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Cargando detalles de la variación...</p>
          </div>
        ) : (
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Título</Form.Label>
                  <Form.Control
                    value={variationData.title || ''}
                    onChange={(e) =>
                      setVariationData({ ...variationData, title: e.target.value })
                    }
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>SKU <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={variationData.sku || ''}
                    onChange={(e) =>
                      setVariationData({ ...variationData, sku: e.target.value })
                    }
                    isInvalid={!!errors.sku}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.sku}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    style={{ 
                      minHeight: '120px', 
                      resize: 'vertical',
                      overflowY: 'auto'
                    }}
                    value={variationData.description || ''}
                    onChange={(e) =>
                      setVariationData({ ...variationData, description: e.target.value })
                    }
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    {(!variationData.children || variationData.children.length === 0) ? (
                      <Form.Group className="mb-3">
                        <Form.Label>Precio</Form.Label>
                        <Form.Control
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={(variationData.basePrice ?? '').toString()}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setVariationData({
                              ...variationData,
                              basePrice: raw ? parseInt(raw, 10) : 0
                            });
                          }}
                          required
                        />
                        <Form.Text className="text-muted">Ingresa solo números (sin puntos ni comas).</Form.Text>
                      </Form.Group>
                    ) : (
                      <div className="mb-3">
                        <strong>Precio: </strong>
                        {(() => {
                          const { min, max } = getPriceRange(variationData as Product);
                          return min === max
                            ? `$${formatNumberWithCommas(min, 0)}`
                            : `$${formatNumberWithCommas(min, 0)} - $${formatNumberWithCommas(max, 0)}`;
                        })()}
                      </div>
                    )}
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stock <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        value={variationData.stock || ''}
                        onChange={(e) =>
                          setVariationData({ ...variationData, stock: parseInt(e.target.value) || null })
                        }
                        isInvalid={!!errors.stock}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.stock}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Impuestos</Form.Label>
                  <Select
                    isMulti
                    options={taxesOptions}
                    value={taxesOptions.filter(option => selectedTaxes.includes(option.value))}
                    onChange={(selected: MultiValue<SelectOption>) =>
                      setSelectedTaxes(selected.map(opt => opt.value))
                    }
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Descuentos</Form.Label>
                  <Select
                    isMulti
                    options={discountsOptions}
                    value={discountsOptions.filter(option => selectedDiscounts.includes(option.value))}
                    onChange={(selected: MultiValue<SelectOption>) =>
                      setSelectedDiscounts(selected.map(opt => opt.value))
                    }
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Categorías <span className="text-danger">*</span></Form.Label>
                  <Select
                    isMulti
                    options={categoriesOptions}
                    value={categoriesOptions.filter(option => selectedCategories.includes(option.value))}
                    onChange={(selected: MultiValue<SelectOption>) =>
                      setSelectedCategories(selected.map(opt => opt.value))
                    }
                    className={errors.categories ? 'is-invalid' : ''}
                  />
                  {errors.categories && (
                    <div className="invalid-feedback d-block">
                      {errors.categories}
                    </div>
                  )}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Imágenes</Form.Label>
                  <ImageUploader
                    currentImagesUrls={imagesPreviews}
                    onImagesChange={handleImagesChange}
                    onPreviewsChange={handlePreviewsChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
        {variationToEdit && !isLoadingDetails && variationData.id && (
          <div className="mt-4">
            <h5>Sub-variaciones de esta variación</h5>
            <VariationSection
              currentProduct={variationData as Product}
              storeId={storeId}
              fetchProducts={fetchProducts}
              taxesOptions={taxesOptions}
              discountsOptions={discountsOptions}
              categoriesOptions={categoriesOptions}
              depth={1}
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading || isLoadingDetails}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={isLoading || isLoadingDetails}
        >
          {isLoading ? <><Spinner animation="border" size="sm" /> Guardando...</> : 'Guardar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
