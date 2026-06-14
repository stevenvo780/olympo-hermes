'use client';
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaPlus, FaMinus } from 'react-icons/fa';
import { Product } from '@/types';
import OptimizedImage from '../../OptimizedImage';
import { ProcessedProductInfo } from '..';
import './styles.scss';

interface ProductCardMiniProps {
  product: Product;
  processedInfo: ProcessedProductInfo;
  isHorizontal?: boolean;
  preRender?: boolean;
}

const ProductCardMini: React.FC<ProductCardMiniProps> = ({
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
    handleDecrement
  } = processedInfo;
  const hasNoImage = firstImage === '/images/no-image.png';

  if (preRender) {
    return (
      <div className="product-card mini-card" style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} />
    );
  }

  return (
    <Card
      className={`product-card product-mini ${quantity > 0 || hasSelectedVariations ? 'selected-product' : ''} ${hasNoImage ? 'no-image' : ''}`}
      onClick={handleCardClick}
    >
      {discountInfo && (
        <Badge className="mini-discount-badge">
          -{discountInfo.formattedDiscountValue}%
        </Badge>
      )}

      {!hasNoImage && (
        <div className="product-mini-image-container">
          <OptimizedImage
            src={firstImage}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      <Card.Body className="mini-body">
        <Card.Title className="mini-title">{product.title}</Card.Title>

        <div className="mini-price">
          {hasDiscount ? (
            <div className="mini-price-discount">
              <span className="mini-original-price">{formattedBasePrice}</span>
              <span className="mini-discounted-price">{formattedDiscountedPrice}</span>
            </div>
          ) : (
            <span className="mini-current-price">{formattedBasePrice}</span>
          )}
        </div>

        <div className="mini-actions">
          {quantity > 0 ? (
            <div className="mini-quantity-control">
              <Button
                variant="primary"
                size="sm"
                className="mini-quantity-btn"
                onClick={handleDecrement}
                aria-label="Quitar uno"
              >
                <FaMinus />
              </Button>
              <span className="mini-quantity">{quantity}</span>
              <Button
                variant="primary"
                size="sm"
                className="mini-quantity-btn"
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
              className="mini-add-btn"
            >
              <FaShoppingCart />
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default React.memo(ProductCardMini, (prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.product.basePrice !== next.product.basePrice) return false;
  if (prev.product.discountPrice !== next.product.discountPrice) return false;
  if (prev.processedInfo.quantity !== next.processedInfo.quantity) return false;
  if (prev.processedInfo.hasSelectedVariations !== next.processedInfo.hasSelectedVariations) return false;
  return true;
});
