'use client';
import React from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaTag, FaEye, FaShoppingCart, FaPlus, FaMinus } from 'react-icons/fa';
import OptimizedImage from '../../OptimizedImage';
import { Product } from '@/types';
import { ProcessedProductInfo } from '../index';
import './styles.scss';

interface ProductCardListProps {
  product: Product;
  processedInfo: ProcessedProductInfo;
  isHorizontal?: boolean;
  preRender?: boolean;
}

const ProductCardList: React.FC<ProductCardListProps> = ({
  product,
  processedInfo,
  isHorizontal = false,
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
      <div className={`product-card list-card h-100 ${isHorizontal ? 'horizontal-card' : 'grid-card'}`}
        style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} />
    );
  }

  return (
    <Card
      className={`product-card product-list ${quantity > 0 || hasSelectedVariations ? 'selected-product' : ''} ${hasNoImage ? 'no-image' : ''}`}
      onClick={handleCardClick}
    >
      <Card.Body className="list-body p-0">
        <Row className="g-0 h-100">
          {!hasNoImage && (
            <Col xs={12} sm={4} md={3} lg={2} className="list-image-col">
              <div className="list-image-container">
                <OptimizedImage
                  src={firstImage}
                  alt={product.title}
                  objectFit="cover"
                  fallbackSrc="/images/no-image.png"
                />
                {discountInfo && (
                  <Badge className="list-discount-badge">
                    <FaTag className="me-1" size={10} />
                    -{discountInfo.formattedDiscountValue}%
                  </Badge>
                )}
              </div>
            </Col>
          )}

          <Col
            xs={12}
            sm={hasNoImage ? 9 : 8}
            md={hasNoImage ? 9 : 6}
            lg={hasNoImage ? 9 : 7}
            className="list-content-col"
          >
            <div className="list-content">

              {hasNoImage && discountInfo && (
                <div className="list-badges-row mb-2">
                  <Badge className="list-discount-badge">
                    <FaTag className="me-1" size={10} />
                    -{discountInfo.formattedDiscountValue}%
                  </Badge>
                </div>
              )}

              <Card.Title className="list-title mb-2">
                {product.title}
              </Card.Title>

              <Card.Text className={hasNoImage
                ? 'list-description-expanded text-muted mb-3'
                : 'list-description text-muted mb-3'
              }>
                {hasNoImage ? product.description : shortDescription}
              </Card.Text>

              <div className="list-price-section">
                {hasDiscount ? (
                  <div className="price-with-discount">
                    <span className="original-price me-2">{formattedBasePrice}</span>
                    <span className="discounted-price">{formattedDiscountedPrice}</span>
                  </div>
                ) : (
                  <span className="current-price">{formattedBasePrice}</span>
                )}
              </div>
            </div>
          </Col>

          <Col
            xs={12}
            sm={hasNoImage ? 3 : 12}
            md={hasNoImage ? 3 : 3}
            lg={hasNoImage ? 3 : 3}
            className="list-actions-col"
          >
            <div className="list-actions">

              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleShowDetails}
                className="details-btn mb-2"
              >
                <FaEye className="me-1" size={12} />
                Ver más
              </Button>

              {quantity > 0 ? (
                <div className="quantity-control-list">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="quantity-btn"
                    onClick={handleDecrement}
                  >
                    <FaMinus size={10} />
                  </Button>
                  <span className="quantity mx-2">{quantity}</span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="quantity-btn"
                    onClick={handleIncrement}
                  >
                    <FaPlus size={10} />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddToCart}
                  className="add-to-cart-btn"
                >
                  <FaShoppingCart className="me-1" size={12} />
                  Agregar
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default React.memo(ProductCardList, (prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.product.basePrice !== next.product.basePrice) return false;
  if (prev.product.discountPrice !== next.product.discountPrice) return false;
  if (prev.processedInfo.quantity !== next.processedInfo.quantity) return false;
  if (prev.processedInfo.hasSelectedVariations !== next.processedInfo.hasSelectedVariations) return false;
  return true;
});
