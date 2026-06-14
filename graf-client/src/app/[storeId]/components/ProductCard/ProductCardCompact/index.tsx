'use client';
import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaEye, FaPlus, FaMinus } from 'react-icons/fa';
import { Product } from '@/types';
import OptimizedImage from '../../OptimizedImage';
import { ProcessedProductInfo } from '..';
import './styles.scss';

interface ProductCardCompactProps {
  product: Product;
  processedInfo: ProcessedProductInfo;
  preRender?: boolean;
}

const ProductCardCompact: React.FC<ProductCardCompactProps> = ({
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

  if (preRender) {
    return (
      <div className="product-card-compact h-100"
        style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} />
    );
  }

  return (
    <div
      className={`product-card-compact ${quantity > 0 || hasSelectedVariations ? 'selected-product' : ''}`}
    >

      <div className="compact-image-container">
        <OptimizedImage
          src={firstImage}
          alt={product.title}
          objectFit="cover"
          fallbackSrc="/images/no-image.png"
        />
        {hasDiscount && discountInfo && (
          <Badge className="compact-discount-badge">
            -{discountInfo.formattedDiscountValue}%
          </Badge>
        )}
      </div>

      <div className="compact-content">
        <div className="compact-info">
          <h6 className="compact-title" onClick={handleCardClick}>
            {product.title}
          </h6>

          <div className="compact-price">
            {hasDiscount ? (
              <>
                <span className="price-discounted">{formattedDiscountedPrice}</span>
                <span className="price-original">{formattedBasePrice}</span>
              </>
            ) : (
              <span className="price-current">{formattedBasePrice}</span>
            )}
          </div>
        </div>

        <div className="compact-controls">
          {quantity > 0 ? (
            <div className="quantity-controls-compact">
              <Button
                variant="outline-secondary"
                size="sm"
                className="qty-btn"
                onClick={handleDecrement}
              >
                <FaMinus size={10} />
              </Button>
              <span className="qty-display">{quantity}</span>
              <Button
                variant="outline-secondary"
                size="sm"
                className="qty-btn"
                onClick={handleIncrement}
              >
                <FaPlus size={10} />
              </Button>
            </div>
          ) : (
            <div className="compact-actions">
              <Button
                variant="outline-primary"
                size="sm"
                className="action-btn"
                onClick={handleShowDetails}
              >
                <FaEye size={10} />
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="action-btn"
                onClick={handleAddToCart}
                disabled={!processedInfo.canAddToCart}
              >
                <FaShoppingCart size={10} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCardCompact;
