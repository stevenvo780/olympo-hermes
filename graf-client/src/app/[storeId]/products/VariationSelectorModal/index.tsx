import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Product } from '@/types';
import type { AppDispatch } from '@/redux/store';
import api from '@/utils/axios';
import VariationSelectorModalBody from './VariationSelectorModalBody';
import ProductDetailModal from '../ProductDetailModal';

interface VariationSelectorModalProps {
  show: boolean;
  onHide: () => void;
  parentProduct: Product;
  handleShowDetails?: (product: Product) => void;
  dispatch: AppDispatch;
  storeId: string;
}

const VariationSelectorModal: React.FC<VariationSelectorModalProps> = ({
  show,
  onHide,
  parentProduct,
  handleShowDetails,
  dispatch,
  storeId
}) => {
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [variationSelectorParent, setVariationSelectorParent] = useState<Product | null>(null);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    api.get(`/products/${storeId}/${parentProduct.id}`)
      .then(({ data }) => setDetailedProduct(data))
      .finally(() => setLoading(false));
  }, [show, parentProduct.id, storeId]);

  const variations = detailedProduct?.children || [];

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedProduct(null);
  }, []);

  const handleShowVariation = useCallback(
    (variation: Product) => {
      setVariationSelectorParent(variation);
    }, []);

  const handleShowDetailsLocal = useCallback(
    (variation: Product) => {
      setSelectedProduct(variation);
      setShowDetailModal(true);
    }, []);

  return (
    <>
      {selectedProduct && (
        <ProductDetailModal
          show={showDetailModal}
          onHide={handleCloseDetailModal}
          product={selectedProduct}
        />
      )}
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Seleccione una opción</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <VariationSelectorModalBody
            loading={loading}
            variations={variations}
            handleShowDetails={handleShowDetails || handleShowDetailsLocal}
            handleShowVariation={handleShowVariation}
            dispatch={dispatch}
            storeId={storeId}
          />
        </Modal.Body>
      </Modal>
      {variationSelectorParent && (
        <VariationSelectorModal
          show={!!variationSelectorParent}
          onHide={() => setVariationSelectorParent(null)}
          parentProduct={variationSelectorParent}
          dispatch={dispatch}
          storeId={storeId}
        />
      )}
    </>
  );
};

export default VariationSelectorModal;
