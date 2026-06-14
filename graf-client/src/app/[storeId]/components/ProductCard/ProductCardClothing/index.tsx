'use client';
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaTag, FaPlus, FaMinus } from 'react-icons/fa';
import { Product } from '@/types';
import OptimizedImage from '../../OptimizedImage';
import { ProcessedProductInfo } from '..';
import './styles.scss';

interface ProductCardClothingProps {
  product: Product;
  processedInfo: ProcessedProductInfo;
  isHorizontal?: boolean;
  preRender?: boolean;
}

const ProductCardClothing: React.FC<ProductCardClothingProps> = ({
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
      <div className={`product-card clothing-card h-100 ${isHorizontal ? 'horizontal-card' : 'grid-card'}`}
        style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} />
    );
  }

  return (
    <Card
      className={`product-card product-clothing ${quantity > 0 || hasSelectedVariations ? 'selected-product' : ''} ${hasNoImage ? 'no-image' : ''}`}
      onClick={handleCardClick}
    >
      <div className="badges-container">

        {discountInfo && (
          <Badge className="badge-discount">
            <FaTag className="me-1" /> {discountInfo.formattedDiscountValue}%
          </Badge>
        )}
      </div>

      {!hasNoImage && (
        <div className="product-clothing-image-container">
          <OptimizedImage
            src={firstImage}
            alt={product.title}
            objectFit="contain"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      <Card.Body className="clothing-body">
        <div className="clothing-content">
          <Card.Title className="clothing-title">{product.title}</Card.Title>
          <Card.Text className={hasNoImage
            ? 'product-description-expanded text-muted mb-2'
            : 'product-description text-muted mb-2'}>
            {hasNoImage ? product.description : shortDescription}
          </Card.Text>

          <div className="price-section">
            {hasDiscount ? (
              <div className="price-with-discount">
                <span className="original-price">
                  {formattedBasePrice}
                </span>
                <span className="discounted-price">
                  {formattedDiscountedPrice}
                </span>
              </div>
            ) : (
              <div className="price-normal">
                <span className="current-price">{formattedBasePrice}</span>
              </div>
            )}
          </div>
        </div>

        <div className="clothing-actions mt-2 d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleShowDetails}
            className="flex-fill details-btn"
          >
            Ver más
          </Button>

          {quantity > 0 ? (
            <div className="quantity-control-clothing d-flex flex-fill">
              <Button variant="primary" size="sm" onClick={handleDecrement} className="quantity-btn">
                <FaMinus />
              </Button>
              <div className="quantity-display d-flex align-items-center justify-content-center flex-grow-1">
                {quantity}
              </div>
              <Button variant="primary" size="sm" onClick={handleIncrement} className="quantity-btn">
                <FaPlus />
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              className="flex-fill add-to-cart-btn"
            >
              <FaShoppingCart className="me-1" /> Añadir
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default React.memo(ProductCardClothing, (prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.product.basePrice !== next.product.basePrice) return false;
  if (prev.product.discountPrice !== next.product.discountPrice) return false;
  if (prev.processedInfo.quantity !== next.processedInfo.quantity) return false;
  if (prev.processedInfo.hasSelectedVariations !== next.processedInfo.hasSelectedVariations) return false;
  return true;
});
