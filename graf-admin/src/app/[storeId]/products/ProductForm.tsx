'use client';
import React, { useState } from 'react';
import { Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import Select, { MultiValue } from 'react-select';
import { SelectOption } from '@/types/product';
import { Product } from '@/types';
import ImageUploader from '@/components/ImageUploader';
import HtmlTextEditor from '@/components/HtmlTextEditor';
import VariationSection from './VariationSection';
import { formatNumberWithCommas } from '@/utils/formatters';

interface ProductFormProps {
  modalMode: 'create' | 'edit';
  currentProduct: Product | null;
  title: string;
  description: string;
  longDescription: string;
  basePrice: string;
  stock: string;
  imagesPreviews: string[];
  selectedTaxes: number[];
  selectedDiscounts: number[];
  selectedCategories: number[];
  taxesOptions: SelectOption[];
  discountsOptions: SelectOption[];
  categoriesOptions: SelectOption[];
  isUploading: boolean;
  storeId: string;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onImagesChange: (files: File[]) => void;
  onPreviewsChange: (previews: string[]) => void;
  onClose: () => void;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setLongDescription: (value: string) => void;
  setBasePrice: (value: string) => void;
  setStock: (value: string) => void;
  setSelectedTaxes: (values: number[]) => void;
  setSelectedDiscounts: (values: number[]) => void;
  setSelectedCategories: (values: number[]) => void;
  fetchProducts: () => void;
  sku: string;
  setSku: (sku: string) => void;
}

export default function ProductForm({
  modalMode,
  currentProduct,
  title,
  description,
  longDescription,
  basePrice,
  stock,
  imagesPreviews,
  selectedTaxes,
  selectedDiscounts,
  selectedCategories,
  taxesOptions,
  discountsOptions,
  categoriesOptions,
  isUploading,
  storeId,
  onSubmit,
  onImagesChange,
  onPreviewsChange,
  onClose,
  setTitle,
  setDescription,
  setLongDescription,
  setBasePrice,
  setStock,
  setSelectedTaxes,
  setSelectedDiscounts,
  setSelectedCategories,
  fetchProducts,
  sku,
  setSku,
}: ProductFormProps) {
  const [categoryError, setCategoryError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategories.length) {
      setCategoryError('Debe seleccionar al menos una categoría');
      return;
    } else {
      setCategoryError('');
    }
    
    onSubmit(e);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>SKU</Form.Label>
            <Form.Control
              type="text"
              placeholder="SKU del producto"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Título</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Form.Text className="text-muted">Descripción corta del producto.</Form.Text>
          </Form.Group>

          <HtmlTextEditor
            value={longDescription}
            onChange={setLongDescription}
            label="Descripción Larga"
            placeholder="Escribe la descripción detallada del producto..."
            helpText="Descripción detallada (opcional). Puedes usar HTML o texto plano."
          />

          <Row>
            <Col md={6}>
              {(!currentProduct || !currentProduct.children || currentProduct.children.length === 0) ? (
                <Form.Group className="mb-3">
                  <Form.Label>Precio Base</Form.Label>
                  <Form.Control
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <Form.Text className="text-muted">Ingresa solo números (sin puntos ni comas).</Form.Text>
                </Form.Group>
              ) : (
                <div className="mb-3">
                  <strong>Precio Base: </strong>
                  {(() => {
                    const precios = currentProduct.children.map(child => Number(child.basePrice));
                    const min = Math.min(...precios);
                    const max = Math.max(...precios);
                    return min === max
                      ? `$${formatNumberWithCommas(min, 0)}`
                      : `$${formatNumberWithCommas(min, 0)} - $${formatNumberWithCommas(max, 0)}`;
                  })()}
                </div>
              )}
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
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
            <Form.Label>
              Categorías <span className="text-danger">*</span>
            </Form.Label>
            <Select
              isMulti
              options={categoriesOptions}
              value={categoriesOptions.filter(option => selectedCategories.includes(option.value))}
              onChange={(selected: MultiValue<SelectOption>) => {
                setSelectedCategories(selected.map(opt => opt.value));
                if (selected.length > 0) {
                  setCategoryError('');
                }
              }}
              className={categoryError ? 'is-invalid' : ''}
            />
            {categoryError && (
              <Form.Control.Feedback type="invalid">
                {categoryError}
              </Form.Control.Feedback>
            )}
            <Form.Text className="text-muted">
              Es obligatorio seleccionar al menos una categoría.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Galería de Imágenes</Form.Label>
            <ImageUploader
              currentImagesUrls={imagesPreviews}
              onImagesChange={onImagesChange}
              onPreviewsChange={onPreviewsChange}
            />
          </Form.Group>
        </Col>
      </Row>

      {modalMode === 'edit' && currentProduct && (
        <VariationSection
          currentProduct={currentProduct}
          storeId={storeId}
          fetchProducts={fetchProducts}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      )}

      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onClose} className="me-2">
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={isUploading}>
          {isUploading ? <Spinner animation="border" size="sm" /> : (modalMode === 'create' ? 'Crear' : 'Actualizar')}
        </Button>
      </div>
    </Form>
  );
}
