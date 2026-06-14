'use client';
import React, { useState } from 'react';
import { Table, Button, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import api from '@/utils/axios';
import { Product, VariationSectionProps, SelectOption } from '@/types/product';
import Image from 'next/image';
import VariationModal from './VariationModal';
import { AxiosError } from 'axios';
import { FaPlus, FaEdit, FaTrash, FaImage } from 'react-icons/fa';
import { extractFirstValidImageUrl } from '@/components/ImageUploader';
import { formatNumberWithCommas } from '@/utils/formatters';
import { getPriceRange } from '@/utils/productPrice';

interface ExtendedVariationSectionProps extends VariationSectionProps {
  taxesOptions: SelectOption[];
  discountsOptions: SelectOption[];
  categoriesOptions: SelectOption[];
}

export default function VariationSection({
  currentProduct,
  storeId,
  fetchProducts,
  taxesOptions,
  discountsOptions,
  categoriesOptions,
  depth = 0
}: ExtendedVariationSectionProps & { depth?: number }) {
  const dispatch = useDispatch();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [variationToDelete, setVariationToDelete] = useState<number | null>(null);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Product | null>(null);

  const handleDeleteClick = (variationId: number) => {
    setVariationToDelete(variationId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (variationToDelete) {
      try {
        const response = await api.delete(`/products/${storeId}/${variationToDelete}`);
        const message = response.data && typeof response.data === 'object' && 'enabled' in response.data && !response.data.enabled
          ? 'Variación deshabilitada exitosamente (tenía pedidos asociados)'
          : 'Variación eliminada exitosamente';
        dispatch(addNotification({ message, color: 'success' }));
        fetchProducts(); 
      } catch (error: unknown) {
        console.error('Error deleting variation:', error);
        const errorAxios = error as AxiosError;
        const data = errorAxios.response?.data as { message: string };
        const errMsg = data?.message || 'Error al eliminar la variación';
        dispatch(addNotification({ message: errMsg, color: 'danger' }));
      }
      setShowDeleteModal(false);
      setVariationToDelete(null);
    }
  };

  const handleOpenModal = (variation?: Product) => {
    setSelectedVariation(variation || null);
    setShowVariationModal(true);
  };

  const renderRows = (variations: Product[], level: number): React.ReactNode[] =>
    variations
      .slice()
      .sort((a, b) => a.id - b.id)
      .flatMap((variation) => {
      const row = (
        <tr key={variation.id}>
          <td style={{ paddingLeft: `${level * 20}px` }}>{variation.title}</td>
          <td>{variation.sku || 'N/A'}</td>
          <td>
            {variation.children && variation.children.length > 0 ? (
              (() => {
                const { min, max } = getPriceRange(variation);
                return min === max
                  ? `$${formatNumberWithCommas(min, 0)}`
                  : `$${formatNumberWithCommas(min, 0)} - $${formatNumberWithCommas(max, 0)}`;
              })()
            ) : (
              `$${formatNumberWithCommas(typeof variation.basePrice === 'string' ? parseFloat(variation.basePrice) || 0 : (variation.basePrice || 0), 0)}`
            )}
          </td>
          <td>{variation.stock ?? 'N/A'}</td>
          <td className="text-truncate" style={{ maxWidth: '150px' }}>{variation.description}</td>
          <td>
            {variation.images && variation.images.length > 0 ? (
              <Image
                src={extractFirstValidImageUrl(variation.images)}
                alt={variation.title}
                width={50}
                height={50}
                quality={30}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <span className="text-muted">
                <FaImage size={30} />
              </span>
            )}
          </td>
          <td>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenModal(variation)}
              className="me-2"
            >
              <FaEdit className="me-1" />
              Editar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteClick(variation.id)}
            >
              <FaTrash className="me-1" />
              Eliminar
            </Button>
          </td>
        </tr>
      );
      const childrenRows = variation.children && variation.children.length > 0
        ? renderRows(variation.children, level + 1)
        : [];
      return [row, ...childrenRows];
    });

  return (
    <div>
      <h5 style={{ marginTop: depth === 0 ? 0 : '1rem' }}>
        {depth === 0 ? 'Variaciones del producto' : 'Sub-variaciones'}
      </h5>
      <Button variant="primary" className="mb-2" onClick={() => handleOpenModal()}>
        <FaPlus className="me-1" />
        {depth === 0 ? 'Agregar Variación' : 'Agregar Sub-variación'}
      </Button>
      <Table>
        <thead>
          <tr>
            <th>Título</th>
            <th>SKU</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Descripción</th>
            <th>Imágenes</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {renderRows(currentProduct.children || [], depth)}
        </tbody>
      </Table>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Está seguro que desea eliminar esta variación?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {showVariationModal && (
        <VariationModal
          show={showVariationModal}
          onHide={() => setShowVariationModal(false)}
          storeId={storeId}
          fetchProducts={fetchProducts}
          parentProduct={currentProduct}
          variationToEdit={selectedVariation}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      )}
    </div>
  );
}
