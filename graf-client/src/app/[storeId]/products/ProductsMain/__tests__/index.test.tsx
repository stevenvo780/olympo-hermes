/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// MOCKS MUST BE DECLARED BEFORE ANY IMPORTS THAT USE THEM
vi.mock('../../props/ProductSlider', () => ({
  default: () => <div data-testid="product-slider">ProductSlider</div>,
}));
vi.mock('../../ProductFilters', () => ({
  default: () => <div data-testid="product-filters">ProductFilters</div>,
}));
vi.mock('../../CategorySlider', () => ({
  default: () => <div data-testid="category-slider">CategorySlider</div>,
}));
vi.mock('../../CompactCategorySlider', () => ({
  default: () => <div data-testid="compact-category-slider">CompactCategorySlider</div>,
}));
vi.mock('../../CategorySection', () => ({
  default: ({ category }: any) => <div data-testid={`category-section-${category.id}`}>{category.name}</div>,
}));
vi.mock('../../ProductDetailModal', () => ({
  default: ({ show }: any) => show ? <div data-testid="product-detail-modal">ProductDetailModal</div> : null,
}));
vi.mock('../../VariationSelectorModal', () => ({
  default: ({ show }: any) => show ? <div data-testid="variation-selector-modal">VariationSelectorModal</div> : null,
}));

// Mock redux and navigation
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
  useDispatch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Now import the component and other mocked modules
import ProductsClient from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import api from '@/utils/axios';

describe('ProductsClient', () => {
  const mockDispatch = vi.fn();
  const mockReloadAllProductsByCategory = vi.fn();

  interface StateOverrides {
    ui?: Partial<{
      store: { configuration: { banners: any[] } };
      searchText: string;
      showFilterSidebar: boolean;
    }>;
    categories?: Partial<{
      categories: any[];
      rootCategories: any[];
      loading: boolean;
    }>;
    products?: Partial<{
      filters: { category: string; minPrice: number; maxPrice: number; discount: string };
      productsByCategory: Record<string, any>;
    }>;
  }

  const getMockState = (overrides: StateOverrides = {}) => ({
    ui: {
      store: { configuration: { banners: [] } },
      searchText: '',
      showFilterSidebar: false,
      ...(overrides.ui || {})
    },
    categories: {
      categories: [],
      rootCategories: [],
      loading: false,
      ...(overrides.categories || {})
    },
    products: {
      filters: { category: '', minPrice: 0, maxPrice: 0, discount: '' },
      productsByCategory: {},
      ...(overrides.products || {})
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useDispatch as any).mockReturnValue(mockDispatch);
    (useParams as any).mockReturnValue({ storeId: 'test-store' });
    (usePathname as any).mockReturnValue('/test-store/products');
    (useRouter as any).mockReturnValue({ push: vi.fn(), back: vi.fn() });
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
    (useProducts as any).mockReturnValue({
      reloadAllProductsByCategory: mockReloadAllProductsByCategory,
    });

    (useSelector as any).mockImplementation((selector: any) => selector(getMockState()));
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    render(<ProductsClient />);
    // El componente renderiza correctamente sin categorías
    expect(screen.getByText('No hay productos disponibles')).toBeDefined();
  });

  it('renders banners when provided in config', () => {
    (useSelector as any).mockImplementation((selector: any) => selector(getMockState({
      ui: { store: { configuration: { banners: [{ id: 1, image: 'banner.jpg' }] } } }
    })));

    render(<ProductsClient />);
    expect(screen.getByTestId('product-slider')).toBeDefined();
  });

  it('initializes with SSR data', () => {
    const categoriesSSR = [{ id: 1, name: 'Category 1' }];
    render(<ProductsClient categoriesSSR={categoriesSSR as any} />);

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'categories/setCategories',
      payload: categoriesSSR
    }));
  });

  it('fetches categories if not provided and no SSR data', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    render(<ProductsClient />);

    expect(api.get).toHaveBeenCalledWith('/categories/test-store');
  });

  it('shows filter sidebar when showFilterSidebar is true', () => {
    (useSelector as any).mockImplementation((selector: any) => selector(getMockState({
      ui: { showFilterSidebar: true }
    })));

    render(<ProductsClient />);
    expect(screen.getAllByText('Filtros').length).toBeGreaterThan(0);
    expect(screen.getByTestId('product-filters')).toBeDefined();
  });

  it('toggles filter sidebar on close button click', () => {
    (useSelector as any).mockImplementation((selector: any) => selector(getMockState({
      ui: { showFilterSidebar: true }
    })));

    render(<ProductsClient />);
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]);

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'ui/toggleFilterSidebar',
      payload: false
    }));
  });

  it('updates filters from search params', () => {
    const mockSearchParams = {
      get: vi.fn().mockImplementation((key) => {
        if (key === 'category') return '10';
        if (key === 'discount') return '20';
        return null;
      }),
    };
    (useSearchParams as any).mockReturnValue(mockSearchParams);

    render(<ProductsClient />);

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'products/setFilters',
      payload: expect.objectContaining({ category: '10', discount: '20' })
    }));
  });

  it('reloads products when search text changes', async () => {
    (useSelector as any).mockImplementation((selector: any) => selector(getMockState({
      ui: { searchText: 'test search' },
      categories: { categories: [{ id: 1 }], rootCategories: [] }
    })));

    render(<ProductsClient />);

    await waitFor(() => {
      expect(mockReloadAllProductsByCategory).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('renders categories from rootCategories', () => {
    const rootCategories = [{ id: 1, name: 'Root Category' }];
    (useSelector as any).mockImplementation((selector: any) => selector(getMockState({
      categories: { rootCategories, categories: [] }
    })));

    render(<ProductsClient />);
    expect(screen.getByTestId('category-section-1')).toBeDefined();
    expect(screen.getByText('Root Category')).toBeDefined();
  });
});
