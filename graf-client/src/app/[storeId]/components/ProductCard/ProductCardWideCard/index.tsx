'use client';
import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaShoppingCart, FaTag, FaRuler, FaPlus, FaMinus, FaStar } from 'react-icons/fa';
import { Product } from '@/types';
import OptimizedImage from '../../OptimizedImage';
import { ProcessedProductInfo } from '..';
import './styles.scss';

interface ProductCardWideCardProps {
  product: Product;
  processedInfo: ProcessedProductInfo;
  isHorizontal?: boolean;
  preRender?: boolean;
}

const ProductCardWideCard: React.FC<ProductCardWideCardProps> = ({
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
      <div className="product-card wide-card" style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} />
    );
  }

  return (
    <Card
      className={`product-card product-wide-card ${quantity > 0 || hasSelectedVariations ? 'selected-product' : ''} ${hasNoImage ? 'no-image' : ''}`}
      onClick={handleCardClick}
    >
      <Card.Body className="wide-card-body p-3">
        <div className={`wide-card-grid ${hasNoImage ? 'no-image-layout' : 'with-image-layout'}`}>

          {!hasNoImage && (
            <div className="wide-card-image-container">
              <OptimizedImage
                src={firstImage}
                alt={product.title}
                objectFit="cover"
                fallbackSrc="/images/no-image.png"
              />
              {discountInfo && (
                <div className="discount-overlay">
                  <Badge className="discount-badge">
                    <FaTag className="me-1" /> -{discountInfo.formattedDiscountValue}%
                  </Badge>
                </div>
              )}
            </div>
          )}

          <div className="wide-card-content">
            <div className="product-header mb-2">
              <h5 className="wide-card-title mb-2">{product.title}</h5>
              <div className="badges-row mb-2">
                {product.variationType && product.value && (
                  <Badge className="badge-measure me-2">
                    <FaRuler className="me-1" /> {product.variationType}: {product.value}
                  </Badge>
                )}
                <Badge className="badge-featured">
                  <FaStar className="me-1" /> Destacado
                </Badge>
              </div>
            </div>

            <p className={hasNoImage
              ? 'product-description-expanded text-muted mb-3'
              : 'product-description-wide text-muted mb-3'}>
              {hasNoImage ? product.description : product.description || shortDescription}
            </p>

            <div className="wide-card-price-section">
              {hasDiscount ? (
                <div className="price-with-discount-wide">
                  <span className="original-price-wide me-3">{formattedBasePrice}</span>
                  <span className="discounted-price-wide">{formattedDiscountedPrice}</span>
                </div>
              ) : (
                <span className="current-price-wide">{formattedBasePrice}</span>
              )}
            </div>
          </div>

          <div className="wide-card-actions">
            <div className="d-none d-md-flex flex-column gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleShowDetails}
                className="details-btn-wide w-100"
              >
                Ver detalles completos
              </Button>

              {quantity > 0 ? (
                <div className="quantity-control-wide">
                  <div className="quantity-label mb-1">
                    <small className="text-muted">Cantidad en carrito:</small>
                  </div>
                  <div className="quantity-controls">
                    <Button
                      variant="primary"
                      size="sm"
                      className="quantity-btn-wide"
                      onClick={handleDecrement}
                      aria-label="Quitar uno"
                    >
                      <FaMinus />
                    </Button>
                    <span className="quantity-display-wide">
                      {quantity}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      className="quantity-btn-wide"
                      onClick={handleIncrement}
                      aria-label="Añadir uno más"
                    >
                      <FaPlus />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAddToCart}
                  className="add-btn-wide w-100"
                >
                  <FaShoppingCart className="me-2" /> Añadir al carrito
                </Button>
              )}
            </div>

            <div className="d-md-none mobile-actions">
              <Row className="g-2">
                <Col xs={6}>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleShowDetails}
                    className="details-btn-mobile w-100"
                  >
                    <FaTag className="me-1" /> Detalles
                  </Button>
                </Col>
                <Col xs={6}>
                  {quantity > 0 ? (
                    <div className="quantity-control-mobile">
                      <div className="quantity-controls-mobile">
                        <Button
                          variant="primary"
                          size="sm"
                          className="quantity-btn-mobile"
                          onClick={handleDecrement}
                          aria-label="Quitar uno"
                        >
                          <FaMinus />
                        </Button>
                        <span className="quantity-display-mobile">
                          {quantity}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          className="quantity-btn-mobile"
                          onClick={handleIncrement}
                          aria-label="Añadir uno más"
                        >
                          <FaPlus />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddToCart}
                      className="add-btn-mobile w-100"
                    >
                      <FaShoppingCart className="me-1" /> Agregar
                    </Button>
                  )}
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default React.memo(ProductCardWideCard, (prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.product.basePrice !== next.product.basePrice) return false;
  if (prev.product.discountPrice !== next.product.discountPrice) return false;
  if (prev.processedInfo.quantity !== next.processedInfo.quantity) return false;
  if (prev.processedInfo.hasSelectedVariations !== next.processedInfo.hasSelectedVariations) return false;
  return true;
});
