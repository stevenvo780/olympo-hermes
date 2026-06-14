/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProductCard from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { Product } from '@/types';
import { calculateProductTotalQuantity } from '@/utils/cartVariationsUtils';

// Mock Redux
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

const mockDispatch = vi.fn();
(useDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockDispatch);

// Mock Utils
vi.mock('@/utils/formatters', () => ({
  formatNumberWithCommas: (n: number) => String(n)
}));

vi.mock('@/utils/imageUtils', () => ({
  extractFirstValidImageUrl: () => 'img.jpg'
}));

vi.mock('@/utils/cartVariationsUtils', () => ({
  calculateProductTotalQuantity: vi.fn(() => 0)
}));

vi.mock('@/utils/productPrice', () => ({
  getPriceRange: () => ({ min: 10, max: 20 })
}));

// Mock Actions
vi.mock('@/redux/cart', () => ({
  addToCartWithHierarchy: vi.fn(({ product }) => ({ type: 'addToCart', payload: product })),
  incrementQuantity: vi.fn(({ productId }) => ({ type: 'increment', payload: productId })),
  decrementQuantity: vi.fn(({ productId }) => ({ type: 'decrement', payload: productId })),
}));

import { addToCartWithHierarchy, incrementQuantity, decrementQuantity } from '@/redux/cart';

// Mock Subcomponents
// We cannot use the variable above in the mocks below due to hoisting.
// So we must repeat the implementation or use a better strategy.
// Actually, since we want to avoid massive duplication, let's use a simple mock that we can test against.
// But we primarily test the controller logic passing props.

vi.mock('../ProductCardCarousel', () => ({
  default: ({ processedInfo, product }: any) => (
    <div data-testid="variant-carousel" onClick={processedInfo.handleCardClick}>
      <span>{product.title}</span>
      <button data-testid="add-btn" onClick={processedInfo.handleAddToCart}>Add</button>
      <button data-testid="inc-btn" onClick={processedInfo.handleIncrement}>Inc</button>
      <button data-testid="dec-btn" onClick={processedInfo.handleDecrement}>Dec</button>
      <button data-testid="details-btn" onClick={processedInfo.handleShowDetails}>Details</button>
      <button data-testid="show-variation-btn" onClick={processedInfo.handleShowVariation}>Show Variation</button>
      <span data-testid="discount-value">{processedInfo.discountInfo?.formattedDiscountValue}</span>
      <span data-testid="quantity">{processedInfo.quantity}</span>
    </div>
  )
}));

vi.mock('../ProductCardGrid', () => ({
  default: ({ product }: any) => (
    <div data-testid="variant-grid">
      <span>{product.title}</span>
    </div>
  )
}));

vi.mock('../ProductCardClothing', () => ({
  default: ({ product }: any) => (
    <div data-testid="variant-clothing">
      <span>{product.title}</span>
    </div>
  )
}));

vi.mock('../ProductCardList', () => ({
  default: ({ product }: any) => (
    <div data-testid="variant-list">
      <span>{product.title}</span>
    </div>
  )
}));

vi.mock('../ProductCardFeatured', () => ({
  default: ({ product }: any) => (
    <div data-testid="variant-featured">
      <span>{product.title}</span>
    </div>
  )
}));

vi.mock('../ProductCardClothingGrid', () => ({
  default: ({ product }: any) => (
    <div data-testid="variant-clothing-grid">
      <span>{product.title}</span>
    </div>
  )
}));

vi.mock('../ProductCardWideCard', () => ({
  default: ({ product }: any) => (
    <div data-testid="variant-wide-card">
      <span>{product.title}</span>
    </div>
  )
}));

vi.mock('../ProductCardCompact', () => ({
  default: ({ product }: any) => (
    <div data-testid="variant-compact">
      <span>{product.title}</span>
    </div>
  )
}));

describe('ProductCard', () => {
  const handleShowDetails = vi.fn();
  const handleShowVariation = vi.fn();

  const mockProduct: Product = {
    id: 1,
    title: 'Test Product',
    description: 'Desc',
    priceWithTax: 100,
    totalPrice: 100,
    images: ['img.jpg'],
    canAddToCart: true,
    isParentProduct: false
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      cart: { carts: { 'test-store': { items: [] } } }
    }));
  });

  afterEach(() => {
    cleanup();
  });

  const renderCard = (props: any = {}) => {
    return render(
      <ProductCard
        product={mockProduct}
        handleShowDetails={handleShowDetails}
        handleShowVariation={handleShowVariation}
        dispatch={mockDispatch}
        storeId="test-store"
        {...props}
      />
    );
  };

  it('renders default carousel variant', () => {
    renderCard();
    expect(screen.getByTestId('variant-carousel')).toBeTruthy();
  });

  it('renders grid variant', () => {
    renderCard({ variant: 'grid' });
    expect(screen.getByTestId('variant-grid')).toBeTruthy();
  });

  it('renders clothing variant', () => {
    renderCard({ variant: 'clothing' });
    expect(screen.getByTestId('variant-clothing')).toBeTruthy();
  });

  it('renders list variant', () => {
    renderCard({ variant: 'list' });
    expect(screen.getByTestId('variant-list')).toBeTruthy();
  });

  it('renders featured variant', () => {
    renderCard({ variant: 'featured' });
    expect(screen.getByTestId('variant-featured')).toBeTruthy();
  });

  it('renders clothing-grid variant', () => {
    renderCard({ variant: 'clothing-grid' });
    expect(screen.getByTestId('variant-clothing-grid')).toBeTruthy();
  });

  it('renders wide-card variant', () => {
    renderCard({ variant: 'wide-card' });
    expect(screen.getByTestId('variant-wide-card')).toBeTruthy();
  });

  it('renders compact variant', () => {
    renderCard({ variant: 'compact' });
    expect(screen.getByTestId('variant-compact')).toBeTruthy();
  });

  it('dispatches addToCart when add button clicked for simple product', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('add-btn'));
    expect(addToCartWithHierarchy).toHaveBeenCalledWith(expect.objectContaining({ product: mockProduct }));
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('calls handleShowVariation when add button clicked for parent product', () => {
    const parentProduct = { ...mockProduct, isParentProduct: true };
    renderCard({ product: parentProduct });
    fireEvent.click(screen.getByTestId('add-btn'));
    expect(handleShowVariation).toHaveBeenCalledWith(parentProduct);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('dispatches increment when inc button clicked', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('inc-btn'));
    expect(incrementQuantity).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('dispatches decrement when dec button clicked', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('dec-btn'));
    expect(decrementQuantity).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('calls handleShowDetails when details button clicked', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('details-btn'));
    expect(handleShowDetails).toHaveBeenCalledWith(mockProduct);
  });

  describe('handleCardClick logic', () => {
    it('calls handleShowVariation if isParentProduct', () => {
      const parentProduct = { ...mockProduct, isParentProduct: true };
      renderCard({ product: parentProduct });
      fireEvent.click(screen.getByTestId('variant-carousel'));
      expect(handleShowVariation).toHaveBeenCalledWith(parentProduct);
    });

    it('dispatches addToCartWithHierarchy if quantity is 0', () => {
      // Mock quantity 0 (default)
      renderCard();
      fireEvent.click(screen.getByTestId('variant-carousel'));
      expect(addToCartWithHierarchy).toHaveBeenCalledWith(expect.objectContaining({ product: mockProduct }));
    });

  it('dispatches incrementQuantity if quantity > 0', () => {
      // Mock quantity > 0
      (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
        cart: { carts: { 'test-store': { items: [{ product: mockProduct, quantity: 1 }] } } }
      }));

      // We need to bypass the util mock which forces 0 result in the original mocked file
      // Wait, there is a global mock for 'calculateProductTotalQuantity' higher up returning 0.
      // I need to override that logic or rely on the `directItem` check which is separate from `calculateProductTotalQuantity`?
      // In ProductCard.tsx:
      // const totalQuantity = calculateProductTotalQuantity(product, cartItems);
      // const directItem = cartItems.find(item => item.product.id === product.id);
      // const directQuantity = directItem ? directItem.quantity : 0;
      // ...
      // if (isParentProduct) ... else return { quantity: displayQuantity }
      // where displayQuantity = (product.children && product.children.length > 0) ? totalQuantity : directQuantity;

      // So for a simple product (no children), it uses `directQuantity`. So mocking cart items should work.
      renderCard();
      fireEvent.click(screen.getByTestId('variant-carousel'));
      expect(incrementQuantity).toHaveBeenCalledWith(expect.objectContaining({ productId: mockProduct.id }));
    });
  });

  describe('Discount Formatting', () => {
    it('formats integer discount correctly', () => {
      const productWithDiscount = {
        ...mockProduct,
        discounts: [{ id: 1, name: 'D1', discountType: 'percentage', discountValue: 10 }]
      };
      renderCard({ product: productWithDiscount });
      expect(screen.getByTestId('discount-value').textContent).toBe('10');
    });

    it('formats decimal discount correctly', () => {
      const productWithDiscount = {
        ...mockProduct,
        discounts: [{ id: 1, name: 'D2', discountType: 'percentage', discountValue: 10.5 }]
      };
      renderCard({ product: productWithDiscount });
      expect(screen.getByTestId('discount-value').textContent).toBe('10.5');
    });

    it('handles non-numeric discount values gracefully', () => {
      const productWithDiscount = {
        ...mockProduct,
        discounts: [{ id: 1, name: 'D3', discountType: 'percentage', discountValue: 'abc' }]
      };
      renderCard({ product: productWithDiscount });
      expect(screen.getByTestId('discount-value').textContent).toBe('abc');
    });
  });

  it('calls handleShowVariation from the explicit variation button', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('show-variation-btn'));
    expect(handleShowVariation).toHaveBeenCalledWith(mockProduct);
  });

  it('handles non-array cart items safely', () => {
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      cart: { carts: { 'test-store': { items: null } } }
    }));
    renderCard();
    expect(screen.getByTestId('quantity').textContent).toBe('0');
  });

  it('falls back to zero quantity when cart calculations fail', () => {
    const calculateProductTotalQuantityMock = calculateProductTotalQuantity as unknown as ReturnType<typeof vi.fn>;
    calculateProductTotalQuantityMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    renderCard();
    expect(screen.getByTestId('quantity').textContent).toBe('0');
  });
});
