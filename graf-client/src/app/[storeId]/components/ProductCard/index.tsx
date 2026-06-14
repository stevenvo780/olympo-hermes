import React, { useMemo, useCallback } from 'react';
import ProductCardCarousel from './ProductCardCarousel';
import ProductCardGrid from './ProductCardGrid';
import ProductCardClothing from './ProductCardClothing';
import ProductCardList from './ProductCardList';
import ProductCardFeatured from './ProductCardFeatured';
import ProductCardClothingGrid from './ProductCardClothingGrid';
import ProductCardWideCard from './ProductCardWideCard';
import ProductCardCompact from './ProductCardCompact';
import { Product, Discount } from '@/types';
import { useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { addToCartWithHierarchy, incrementQuantity, decrementQuantity } from '@/redux/cart';
import { formatNumberWithCommas } from '@/utils/formatters';
import { extractFirstValidImageUrl } from '@/utils/imageUtils';
import { calculateProductTotalQuantity } from '@/utils/cartVariationsUtils';
import { getPriceRange } from '@/utils/productPrice';
import './styles.scss';

export type DiscountInfo = Pick<Discount, 'id' | 'name' | 'discountType' | 'discountValue'> & {
  formattedDiscountValue: string;
};

export interface ProductCardProps {
  product: Product;
  handleShowDetails: (product: Product) => void;
  handleShowVariation: (product: Product) => void;
  dispatch: AppDispatch;
  storeId: string;
  isHorizontal?: boolean;
  preRender?: boolean;
  variant?: 'carousel' | 'grid' | 'clothing' | 'list' | 'featured' | 'clothing-grid' | 'wide-card' | 'compact';
}

const formatPrice = (price: number): string => `$${formatNumberWithCommas(price)}`;

const formatDiscountValue = (value: number | string): string => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return `${value ?? ''}`;
  }

  if (Number.isInteger(numericValue)) {
    return numericValue.toString();
  }

  return Number(numericValue.toFixed(2)).toString();
};

export interface ProcessedProductInfo {
  firstImage: string;
  discountInfo: DiscountInfo | null;
  isParentProduct: boolean;
  canAddToCart: boolean;
  shortDescription: string;
  quantity: number;
  hasSelectedVariations: boolean;
  formatPrice: (price: number) => string;
  formattedBasePrice: string;
  formattedDiscountedPrice: string;
  hasDiscount: boolean;
  handleCardClick: () => void;
  handleAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleIncrement: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleDecrement: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleShowDetails: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleShowVariation: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const {
    product,
    handleShowDetails,
    handleShowVariation,
    dispatch,
    storeId,
    isHorizontal = false,
    preRender = false,
    variant = 'carousel'
  } = props;

  const {
    firstImage,
    discountInfo,
    isParentProduct,
    shortDescription,
    formattedBasePrice,
    formattedDiscountedPrice,
    hasDiscount
  } = useMemo(() => {
    const discount = product.discounts?.[0];
    const discountInfo: DiscountInfo | null = discount ? {
      id: discount.id,
      name: discount.name,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      formattedDiscountValue: formatDiscountValue(discount.discountValue)
    } : null;

    const isParent = !!product.isParentProduct;
    const hasDiscount = !isParent && product.discountPrice > 0;

    const fallbackDisplay = isParent ? getPriceRange(product).min : undefined;
    const baseForParent = (isParent ? (product.displayPrice && product.displayPrice > 0 ? product.displayPrice : (fallbackDisplay || 0)) : undefined);

    return {
      firstImage: product.firstImageUrl || extractFirstValidImageUrl(product.images),
      discountInfo,
      isParentProduct: isParent,
      shortDescription: product.description 
        ? (product.description.length > 60 
           ? product.description.substring(0, 60) + '...' 
           : product.description)
        : '',
      formattedBasePrice: isParent ? formatPrice(baseForParent || 0) : formatPrice(product.priceWithTax),
      formattedDiscountedPrice: isParent ? formatPrice(baseForParent || 0) : formatPrice(product.totalPrice),
      hasDiscount
    };

  }, [product]);

  const cartItems = useSelector((state: RootState) => {
    const cart = (state.cart).carts[storeId];
    return cart ? cart.items : [];
  });

  const { quantity, hasSelectedVariations } = useMemo(() => {
    if (!product || !Array.isArray(cartItems)) {
      return { quantity: 0, hasSelectedVariations: false };
    }

    try {
      const totalQuantity = calculateProductTotalQuantity(product, cartItems);
      const directItem = cartItems.find(item => item.product.id === product.id);
      const directQuantity = directItem ? directItem.quantity : 0;

      if (isParentProduct) {
        const variationsQuantity = totalQuantity - directQuantity;

        return {
          quantity: Math.max(0, variationsQuantity),
          hasSelectedVariations: variationsQuantity > 0
        };
      } else {
        const displayQuantity = (product.children && product.children.length > 0)
          ? totalQuantity
          : directQuantity;
        
        return {
          quantity: Math.max(0, displayQuantity),
          hasSelectedVariations: false
        };
      }
    } catch {
      return { quantity: 0, hasSelectedVariations: false };
    }
  }, [cartItems, product, isParentProduct]);

  const handleCardClick = useCallback(() => {
    if (isParentProduct) {
      handleShowVariation(product);
    } else if (quantity === 0) {
      dispatch(addToCartWithHierarchy({ product, storeId: storeId }));
    } else {
      dispatch(incrementQuantity({ productId: product.id, storeId: storeId }));
    }
  }, [handleShowVariation, product, isParentProduct, dispatch, storeId, quantity]);

  const handleAddToCart = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isParentProduct) {
      handleShowVariation(product);
    } else {
      dispatch(addToCartWithHierarchy({ product, storeId: storeId }));
    }
  }, [product, isParentProduct, handleShowVariation, dispatch, storeId]);

  const handleIncrement = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    dispatch(incrementQuantity({ productId: product.id, storeId: storeId }));
  }, [product.id, dispatch, storeId]);

  const handleDecrement = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    dispatch(decrementQuantity({ productId: product.id, storeId: storeId }));
  }, [product.id, dispatch, storeId]);

  const handleShowDetailsAction = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleShowDetails(product);
  }, [handleShowDetails, product]);

  const handleShowVariationAction = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleShowVariation(product);
  }, [handleShowVariation, product]);

  const processedInfo: ProcessedProductInfo = useMemo(() => ({
    firstImage,
    discountInfo,
    isParentProduct,
    shortDescription,
    quantity,
    hasSelectedVariations,
    canAddToCart: product.canAddToCart,
    formatPrice,
    formattedBasePrice,
    formattedDiscountedPrice,
    hasDiscount,
    handleCardClick,
    handleAddToCart,
    handleIncrement,
    handleDecrement,
    handleShowDetails: handleShowDetailsAction,
    handleShowVariation: handleShowVariationAction
  }), [firstImage, discountInfo,
    isParentProduct, shortDescription,
    quantity, hasSelectedVariations,
    product.canAddToCart,
    formattedBasePrice, formattedDiscountedPrice,
    hasDiscount, handleCardClick,
    handleAddToCart, handleIncrement,
    handleDecrement, handleShowDetailsAction, handleShowVariationAction]);

  if (variant === 'grid') {
    return <ProductCardGrid
      product={product}
      processedInfo={processedInfo}
      isHorizontal={isHorizontal}
      preRender={preRender}
    />;
  }

  if (variant === 'clothing') {
    return <ProductCardClothing
      product={product}
      processedInfo={processedInfo}
      isHorizontal={isHorizontal}
      preRender={preRender}
    />;
  }

  if (variant === 'list') {
    return <ProductCardList
      product={product}
      processedInfo={processedInfo}
      isHorizontal={isHorizontal}
      preRender={preRender}
    />;
  }

  if (variant === 'featured') {
    return <ProductCardFeatured
      product={product}
      processedInfo={processedInfo}
      isHorizontal={isHorizontal}
      preRender={preRender}
    />;
  }

  if (variant === 'clothing-grid') {
    return <ProductCardClothingGrid
      product={product}
      processedInfo={processedInfo}
      isHorizontal={isHorizontal}
      preRender={preRender}
    />;
  }

  if (variant === 'wide-card') {
    return <ProductCardWideCard
      product={product}
      processedInfo={processedInfo}
      isHorizontal={isHorizontal}
      preRender={preRender}
    />;
  }

  if (variant === 'compact') {
    return <ProductCardCompact
      product={product}
      processedInfo={processedInfo}
      preRender={preRender}
    />;
  }

  return <ProductCardCarousel
    product={product}
    processedInfo={processedInfo}
    isHorizontal={isHorizontal}
    preRender={preRender}
  />;
};

export default ProductCard;
