'use client';
import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaPlus, FaMinus, FaTag, FaRuler, FaEye } from 'react-icons/fa';
import { Product } from '@/types';
import OptimizedImage from '../../OptimizedImage';
import { ProcessedProductInfo } from '..';
import './styles.scss';

interface ProductCardGridProps {
  product: Product;
  processedInfo: ProcessedProductInfo;
  isHorizontal?: boolean;
  preRender?: boolean;
}

const ProductCardGrid: React.FC<ProductCardGridProps> = ({
  product,
  processedInfo,
  preRender = false
}) => {
  const {
    firstImage,
    discountInfo,
    quantity,
    hasSelectedVariations,
    hasDiscount,
    formattedBasePrice,
    formattedDiscountedPrice,
    handleCardClick,
    handleAddToCart,
    handleIncrement,
    handleDecrement,
    handleShowDetails
  } = processedInfo;
  const hasNoImage = firstImage === '/images/no-image.png';

  if (preRender) {
    return (
      <div className="product-card grid-layout" style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} />
    );
  }

  return (
    <div
      className={`position-relative overflow-hidden rounded h-100 product-card-grid ${quantity > 0 || hasSelectedVariations ? 'selected-product' : ''} ${hasNoImage ? 'no-image' : ''}`}
      onClick={handleCardClick}
      style={{
        cursor: 'pointer',
        minHeight: '280px',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >

      {!hasNoImage && (
        <div className="position-absolute top-0 start-0 w-100 h-100">
          <OptimizedImage
            src={firstImage}
            alt={product.title}
            objectFit="cover"
            fallbackSrc="/images/no-image.png"
          />
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
        </div>
      )}

      <div className="position-absolute top-0 start-0 p-3 d-flex flex-column gap-2" style={{ zIndex: 2 }}>
        {discountInfo && (
          <Badge bg="danger" className="shadow-sm">
            <FaTag className="me-1" style={{ fontSize: '0.7rem' }} />
            {discountInfo.formattedDiscountValue}%
          </Badge>
        )}
        {product.variationType && product.value && (
          <Badge bg="info" className="shadow-sm">
            <FaRuler className="me-1" style={{ fontSize: '0.7rem' }} />
            {product.variationType} - {product.value}
          </Badge>
        )}
      </div>

      <div
        className="position-absolute bottom-0 start-0 w-100 p-4"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          zIndex: 2,
          color: 'var(--white-color)'
        }}
      >

        <h6 className="mb-3 fw-bold lh-sm" style={{
          fontSize: '0.9rem',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.title}
        </h6>

        <div className="d-flex justify-content-between align-items-end">
          <div className="flex-grow-1 me-3">
            {hasDiscount ? (
              <div className="d-flex flex-column">
                <small className="text-decoration-line-through opacity-75" style={{ fontSize: '0.7rem' }}>
                  {formattedBasePrice}
                </small>
                <span className="fw-bold" style={{ fontSize: '1rem', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', color: 'var(--warning-color)' }}>
                  {formattedDiscountedPrice}
                </span>
              </div>
            ) : (
              <span className="fw-bold" style={{ fontSize: '1rem', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {formattedBasePrice}
              </span>
            )}
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="light"
              size="sm"
              onClick={handleShowDetails}
              className="rounded-circle p-1 shadow-sm grid-details-btn"
              style={{ width: '32px', height: '32px' }}
            >
              <FaEye style={{ fontSize: '0.8rem' }} />
            </Button>

            {quantity > 0 ? (
              <div className="d-flex rounded-pill overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--primary-color)' }}>
                <Button
                  variant="primary"
                  size="sm"
                  className="border-0 rounded-0 px-2"
                  onClick={handleDecrement}
                  aria-label="Quitar uno"
                  style={{ fontSize: '0.8rem' }}
                >
                  <FaMinus />
                </Button>
                <div className="d-flex align-items-center justify-content-center px-2 fw-bold" style={{ minWidth: '24px', fontSize: '0.8rem', backgroundColor: 'var(--white-color)', color: 'var(--card-text)' }}>
                  {quantity}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="border-0 rounded-0 px-2"
                  onClick={handleIncrement}
                  aria-label="Añadir uno más"
                  style={{ fontSize: '0.8rem' }}
                >
                  <FaPlus />
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddToCart}
                className="rounded-circle p-1 shadow-sm"
                style={{ width: '32px', height: '32px' }}
              >
                <FaShoppingCart style={{ fontSize: '0.8rem' }} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductCardGrid, (prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.product.basePrice !== next.product.basePrice) return false;
  if (prev.product.discountPrice !== next.product.discountPrice) return false;
  if (prev.processedInfo.quantity !== next.processedInfo.quantity) return false;
  if (prev.processedInfo.hasSelectedVariations !== next.processedInfo.hasSelectedVariations) return false;
  return true;
});
