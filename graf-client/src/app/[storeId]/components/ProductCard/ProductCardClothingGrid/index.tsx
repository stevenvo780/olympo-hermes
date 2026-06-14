'use client';
import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaShoppingCart, FaPlus, FaMinus } from 'react-icons/fa';
import { Product } from '@/types';
import OptimizedImage from '../../OptimizedImage';
import { ProcessedProductInfo } from '..';
import './styles.scss';

interface ProductCardClothingGridProps {
  product: Product;
  processedInfo: ProcessedProductInfo;
  isHorizontal?: boolean;
  preRender?: boolean;
}

const ProductCardClothingGrid: React.FC<ProductCardClothingGridProps> = ({
  product,
  processedInfo,
  preRender = false
}) => {
  const {
    firstImage,
    discountInfo,
    shortDescription,
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
      <div className="product-card clothing-grid-card" style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} />
    );
  }

  return (
    <Card
      className={`product-card product-clothing-grid ${quantity > 0 || hasSelectedVariations ? 'selected-product' : ''} ${hasNoImage ? 'no-image' : ''}`}
      onClick={handleCardClick}
    >

      <div className="clothing-grid-badges-overlay">
        {discountInfo && (
          <Badge className="badge-discount">
            -{discountInfo.formattedDiscountValue}%
          </Badge>
        )}
      </div>

      <Card.Body className="clothing-grid-body">
        <Row className="g-3 h-100">

          <Col xs={6} className="clothing-grid-image-col">
            {!hasNoImage ? (
              <div className="clothing-grid-image-container">
                <OptimizedImage
                  src={firstImage}
                  alt={product.title}
                  objectFit="cover"
                  fallbackSrc="/images/no-image.png"
                />
              </div>
            ) : (
              <div className="clothing-grid-no-image">
                <div className="no-image-placeholder">
                  <i className="fas fa-tshirt"></i>
                </div>
              </div>
            )}
          </Col>

          <Col xs={6} className="clothing-grid-content-col">
            <div className="clothing-grid-content">

              <div className="clothing-grid-title-section">
                <h6 className="clothing-grid-title">{product.title}</h6>
              </div>

              <div className="clothing-grid-description">
                <p className={hasNoImage
                  ? 'product-description-expanded text-muted'
                  : 'product-description text-muted'}>
                  {hasNoImage ? product.description : shortDescription}
                </p>
              </div>

              <div className="clothing-grid-price-section">
                {hasDiscount ? (
                  <div className="price-with-discount">
                    <span className="original-price">{formattedBasePrice}</span>
                    <span className="discounted-price">{formattedDiscountedPrice}</span>
                  </div>
                ) : (
                  <span className="current-price">{formattedBasePrice}</span>
                )}
              </div>

              <div className="clothing-grid-actions">
                <div className="action-buttons">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleShowDetails}
                    className="details-btn"
                  >
                    Ver más
                  </Button>

                  {quantity > 0 ? (
                    <div className="quantity-control-clothing-grid">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="quantity-btn"
                        onClick={handleDecrement}
                        aria-label="Quitar uno"
                      >
                        <FaMinus />
                      </Button>
                      <span className="quantity-display">{quantity}</span>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="quantity-btn"
                        onClick={handleIncrement}
                        aria-label="Añadir uno más"
                      >
                        <FaPlus />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddToCart}
                      className="add-btn"
                    >
                      <FaShoppingCart className="me-1" /> Añadir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default React.memo(ProductCardClothingGrid, (prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.product.basePrice !== next.product.basePrice) return false;
  if (prev.product.discountPrice !== next.product.discountPrice) return false;
  if (prev.processedInfo.quantity !== next.processedInfo.quantity) return false;
  if (prev.processedInfo.hasSelectedVariations !== next.processedInfo.hasSelectedVariations) return false;
  return true;
});
