/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock environment
vi.mock('@/utils/env', () => ({ env: { NEXT_PUBLIC_API_URL: 'http://localhost:3000' } }));

// Mock react-bootstrap
vi.mock('react-bootstrap', () => ({
  Card: Object.assign(
    ({ children, className, onClick }: any) => <div className={className} onClick={onClick}>{children}</div>,
    {
      Body: ({ children, className }: any) => <div className={className}>{children}</div>,
      Title: ({ children, className }: any) => <h5 className={className}>{children}</h5>,
      Text: ({ children, className }: any) => <p className={className}>{children}</p>,
      Footer: ({ children, className }: any) => <div className={className}>{children}</div>,
    }
  ),
  Button: ({ children, onClick, className }: any) => <button className={className} onClick={onClick}>{children}</button>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

// Mock icons
vi.mock('react-icons/fa', () => ({
  FaShoppingCart: () => <span data-testid="cart-icon" />,
  FaTag: () => <span data-testid="tag-icon" />,
  FaRuler: () => <span data-testid="ruler-icon" />,
  FaPlus: () => <span data-testid="plus-icon" />,
  FaMinus: () => <span data-testid="minus-icon" />,
}));

// Mock OptimizedImage
vi.mock('../../OptimizedImage', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: any) => <img src={src} alt={alt} />
}));

import ProductCardFeatured from '../index';
import { Product } from '@/types';
import { ProcessedProductInfo } from '../..';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Test Product',
  title: 'Test Title',
  description: 'Test description for product',
  basePrice: 100,
  discountPrice: 80,
  isActive: true,
  isAvailable: true,
  ...overrides,
} as Product);

const makeProcessedInfo = (overrides: Partial<ProcessedProductInfo> = {}): ProcessedProductInfo => ({
  firstImage: 'https://example.com/image.jpg',
  discountInfo: null,
  isParentProduct: false,
  canAddToCart: true,
  shortDescription: 'Short desc',
  quantity: 0,
  hasSelectedVariations: false,
  hasDiscount: false,
  formatPrice: (price: number) => `$${price}`,
  formattedBasePrice: '$100',
  formattedDiscountedPrice: '$80',
  handleCardClick: vi.fn(),
  handleAddToCart: vi.fn(),
  handleIncrement: vi.fn(),
  handleDecrement: vi.fn(),
  handleShowDetails: vi.fn(),
  handleShowVariation: vi.fn(),
  ...overrides,
});

describe('ProductCardFeatured', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders product card', async () => {
    const product = makeProduct();
    const info = makeProcessedInfo();
    await act(async () => { root.render(<ProductCardFeatured product={product} processedInfo={info} />); });
    expect(container.textContent).toContain('Test Title');
  });

  it('renders preRender placeholder when preRender is true', async () => {
    const product = makeProduct();
    const info = makeProcessedInfo();
    await act(async () => { root.render(<ProductCardFeatured product={product} processedInfo={info} preRender={true} />); });
    expect(container.querySelector('.product-card')).toBeTruthy();
  });

  it('shows discount badge when discount info present', async () => {
    const product = makeProduct();
    const info = makeProcessedInfo({
      discountInfo: { formattedDiscountValue: '20%', discountValue: 20 } as any,
    });
    await act(async () => { root.render(<ProductCardFeatured product={product} processedInfo={info} />); });
    expect(container.textContent).toContain('20%');
  });

  it('shows variation badge', async () => {
    const product = makeProduct({ variationType: 'Size', value: 'Large' });
    const info = makeProcessedInfo();
    await act(async () => { root.render(<ProductCardFeatured product={product} processedInfo={info} />); });
    expect(container.textContent).toContain('Size');
    expect(container.textContent).toContain('Large');
  });

  it('shows add to cart button when quantity is 0', async () => {
    const product = makeProduct();
    const info = makeProcessedInfo({ quantity: 0 });
    await act(async () => { root.render(<ProductCardFeatured product={product} processedInfo={info} />); });
    expect(container.textContent).toContain('Añadir');
  });

  it('shows quantity controls when quantity > 0', async () => {
    const product = makeProduct();
    const info = makeProcessedInfo({ quantity: 2 });
    await act(async () => { root.render(<ProductCardFeatured product={product} processedInfo={info} />); });
    expect(container.textContent).toContain('2');
  });

  it('shows discounted price when hasDiscount is true', async () => {
    const product = makeProduct();
    const info = makeProcessedInfo({ hasDiscount: true, formattedBasePrice: '$100', formattedDiscountedPrice: '$80' });
    await act(async () => { root.render(<ProductCardFeatured product={product} processedInfo={info} />); });
    expect(container.textContent).toContain('$100');
    expect(container.textContent).toContain('$80');
  });

  it('renders horizontal card variant', async () => {
    const product = makeProduct();
    const info = makeProcessedInfo();
    await act(async () => { root.render(<ProductCardFeatured product={product} processedInfo={info} isHorizontal={true} />); });
    expect(container.innerHTML).toContain('product-featured');
  });
});
