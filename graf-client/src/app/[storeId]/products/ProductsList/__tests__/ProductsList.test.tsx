/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import ProductsList from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'next/navigation';

// Mock Dependencies
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
  useDispatch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

vi.mock('@/app/[storeId]/components/ProductCard', () => ({
  default: ({ product }: any) => <div data-testid="product-card">{product.title}</div>
}));

vi.mock('@/app/[storeId]/components/HorizontalSlider', () => ({
  default: ({ children }: any) => <div data-testid="horizontal-slider">{children}</div>
}));

describe('ProductsList', () => {
  const mockDispatch = vi.fn();
  const mockProducts = [
    { id: '1', title: 'Product 1', available: true },
    { id: '2', title: 'Product 2', available: true }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockDispatch);
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ storeId: 'test-store' });

    // Default Selector Mock
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => {
      const state = {
        products: {
          productsByCategory: {
            '100': { products: mockProducts }
          },
          productsByCategoryLoading: { '100': false },
          viewModes: {}
        },
        config: {
          config: { productViewConfig: null } // Use fallback
        }
      };
      return cb(state);
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders category title if provided', () => {
    render(
      <ProductsList
        categoryId={100}
        categoryName="My Category"
        handleShowDetails={vi.fn()}
        handleShowVariation={vi.fn()}
        loadMoreProducts={vi.fn()}
        hasMoreProducts={false}
      />
    );
    expect(screen.getByText('My Category')).toBeTruthy();
  });

  it('renders products in default carousel view', () => {
    render(
      <ProductsList
        categoryId={100}
        handleShowDetails={vi.fn()}
        handleShowVariation={vi.fn()}
        loadMoreProducts={vi.fn()}
        hasMoreProducts={false}
      />
    );
    // Default fallback is carousel
    expect(screen.getByTestId('horizontal-slider')).toBeTruthy();
    expect(screen.getByText('Product 1')).toBeTruthy();
  });

  it('toggles to grid view', () => {
    // We need to render with userSelectedView or interact with buttons
    // Let's interact
    render(
      <ProductsList
        categoryId={100}
        handleShowDetails={vi.fn()}
        handleShowVariation={vi.fn()}
        loadMoreProducts={vi.fn()}
        hasMoreProducts={false}
      />
    );

    // Find toggle buttons. The layout uses view icons.
    // We can find by title 'Vista cuadrícula' from default config
    const gridBtn = screen.getByTitle('Vista cuadrícula');
    fireEvent.click(gridBtn);

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'products/setCategoryViewMode',
      payload: { categoryId: 100, viewMode: 'grid' }
    }));
  });

  it('load more button calls loadMoreProducts', () => {
    // Need to force grid view or check logic
    // Load more button appears if hasMoreProducts is true AND not likely carousel (carousel has its own loader prop passed to HorizontalSlider)
    // Actually rendering grid view reveals the load more button at the bottom

    // Mock current view to grid
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => {
      const state = {
        products: {
          productsByCategory: {
            '100': { products: mockProducts }
          },
          productsByCategoryLoading: { '100': false },
          viewModes: { '100': 'grid' }
        },
        config: { config: null }
      };
      return cb(state);
    });

    const loadMore = vi.fn();
    render(
      <ProductsList
        categoryId={100}
        handleShowDetails={vi.fn()}
        handleShowVariation={vi.fn()}
        loadMoreProducts={loadMore}
        hasMoreProducts={true}
      />
    );

    const btn = screen.getByText('Ver más productos');
    fireEvent.click(btn);
    expect(loadMore).toHaveBeenCalled();
  });

  it('shows loading spinner', () => {
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => {
      const state = {
        products: {
          productsByCategory: { '100': { products: [] } },
          productsByCategoryLoading: { '100': true },
          viewModes: { '100': 'grid' }
        },
        config: { config: null }
      };
      return cb(state);
    });

    render(
      <ProductsList
        categoryId={100}
        handleShowDetails={vi.fn()}
        handleShowVariation={vi.fn()}
        loadMoreProducts={vi.fn()}
        hasMoreProducts={true}
      />
    );

    expect(screen.getByText('Cargando...')).toBeTruthy();
  });
});
