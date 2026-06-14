'use client';
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaTag, FaPlus, FaMinus } from 'react-icons/fa';
import { Product } from '@/types';
import OptimizedImage from '../../OptimizedImage';
import { ProcessedProductInfo } from '..';
import './styles.scss';

interface ProductCardCarouselProps {
  product: Product;
  processedInfo: ProcessedProductInfo;
  isHorizontal?: boolean;
  preRender?: boolean;
}

const ProductCardCarousel: React.FC<ProductCardCarouselProps> = ({
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
  const hasDescription = product.description && product.description.trim();

  if (preRender) {
    return (
      <div className={`product-card h-100 ${isHorizontal ? 'horizontal-card' : 'grid-card'}`}
        style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} />
    );
  }

  return (
    <Card
      className={`product-card product-carousel ${quantity > 0 || hasSelectedVariations ? 'selected-product' : ''} ${hasNoImage ? 'no-image' : ''} ${!hasDescription ? 'compact-card' : ''}`}
      onClick={handleCardClick}
    >
      <Card.Header className="p-2 bg-transparent border-0">
        <div className="d-flex justify-content-between">
          {discountInfo && (
            <Badge className="badge-discount d-flex align-items-center">
              <FaTag className="me-1" /> {discountInfo.formattedDiscountValue}%
            </Badge>
          )}
        </div>
      </Card.Header>
      {!hasNoImage && (
        <div className="product-image-container" style={{ backgroundColor: 'var(--bg-color)' }}>
          <OptimizedImage
            src={firstImage}
            alt={product.title}
            objectFit="cover"
            fallbackSrc="/images/no-image.png"
          />
        </div>
      )}
      <Card.Body className="p-3 d-flex flex-column bg-transparent" style={{ width: '95%' }}>
        <Card.Title className="h6 mb-2">{product.title}</Card.Title>
        {hasDescription && (
          <Card.Text className={hasNoImage
            ? 'product-description-expanded text-muted mb-2'
            : 'product-description text-muted mb-2'}>
            {hasNoImage ? product.description : shortDescription}
          </Card.Text>
        )}
        <div className="mt-auto">
          {hasDiscount ? (
            <div>
              <span className="text-muted text-decoration-line-through me-2">
                {formattedBasePrice}
              </span>
              <span className="fw-bold price-discounted">
                {formattedDiscountedPrice}
              </span>
            </div>
          ) : (
            <div>
              <span className="fw-bold">{formattedBasePrice}</span>
            </div>
          )}
        </div>
      </Card.Body>

      <Card.Footer className="d-flex justify-content-between border-top p-2 bg-transparent" style={{ width: '95%' }}>
        <Button variant="outline-secondary" size="sm" onClick={handleShowDetails} className="text-nowrap">
          Ver más
        </Button>

        {quantity > 0 ? (
          <div className="quantity-control border rounded d-flex align-items-center">
            <Button
              variant="primary"
              size="sm"
              className="quantity-btn rounded-0"
              onClick={handleDecrement}
              aria-label="Quitar uno"
            >
              <FaMinus />
            </Button>
            <div className="quantity d-flex align-items-center justify-content-center px-2 fw-bold">
              {quantity}
            </div>
            <Button
              variant="primary"
              size="sm"
              className="quantity-btn rounded-0"
              onClick={handleIncrement}
              aria-label="Añadir uno más"
            >
              <FaPlus />
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={handleAddToCart}>
            <FaShoppingCart className="me-1" /> Añadir
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};

export default React.memo(ProductCardCarousel, (prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.product.basePrice !== next.product.basePrice) return false;
  if (prev.product.discountPrice !== next.product.discountPrice) return false;
  if (prev.processedInfo.quantity !== next.processedInfo.quantity) return false;
  if (prev.processedInfo.hasSelectedVariations !== next.processedInfo.hasSelectedVariations) return false;
  return true;
});
