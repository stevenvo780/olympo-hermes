'use client';
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaTag, FaRuler, FaPlus, FaMinus } from 'react-icons/fa';
import { Product } from '@/types';
import OptimizedImage from '../../OptimizedImage';
import { ProcessedProductInfo } from '..';
import './styles.scss';

interface ProductCardFeaturedProps {
  product: Product;
  processedInfo: ProcessedProductInfo;
  isHorizontal?: boolean;
  preRender?: boolean;
}

const ProductCardFeatured: React.FC<ProductCardFeaturedProps> = ({
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
      <div className={`product-card featured-card h-100 ${isHorizontal ? 'horizontal-card' : 'grid-card'}`}
        style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} />
    );
  }

  return (
    <Card
      className={`product-card product-featured ${quantity > 0 || hasSelectedVariations ? 'selected-product' : ''} ${hasNoImage ? 'no-image' : ''}`}
      onClick={handleCardClick}
    >
      <div className="badges-container">
        {product.variationType && product.value && (
          <Badge className="badge-measure">
            <FaRuler className="me-1" /> {product.variationType} - {product.value}
          </Badge>
        )}
        {discountInfo && (
          <Badge className="badge-discount">
            <FaTag className="me-1" /> {discountInfo.formattedDiscountValue}%
          </Badge>
        )}
      </div>

      {!hasNoImage && (
        <div className="product-featured-image-container">
          <OptimizedImage
            src={firstImage}
            alt={product.title}
            objectFit="contain"
            fallbackSrc="/images/no-image.png"
          />
        </div>
      )}

      <Card.Body className="featured-body">
        <Card.Title className="featured-title">{product.title}</Card.Title>
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
      </Card.Body>

      <Card.Footer className="featured-footer">
        <Button variant="outline-secondary" size="sm" onClick={handleShowDetails} className="details-btn">
          Ver más
        </Button>

        {quantity > 0 ? (
          <div className="quantity-control-featured">
            <Button
              variant="primary"
              size="sm"
              className="quantity-btn"
              onClick={handleDecrement}
              aria-label="Quitar uno"
            >
              <FaMinus />
            </Button>
            <div className="quantity-display">
              {quantity}
            </div>
            <Button
              variant="primary"
              size="sm"
              className="quantity-btn"
              onClick={handleIncrement}
              aria-label="Añadir uno más"
            >
              <FaPlus />
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={handleAddToCart} className="add-to-cart-btn">
            <FaShoppingCart className="me-1" /> Añadir
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};

export default React.memo(ProductCardFeatured, (prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.product.basePrice !== next.product.basePrice) return false;
  if (prev.product.discountPrice !== next.product.discountPrice) return false;
  if (prev.processedInfo.quantity !== next.processedInfo.quantity) return false;
  if (prev.processedInfo.hasSelectedVariations !== next.processedInfo.hasSelectedVariations) return false;
  return true;
});
