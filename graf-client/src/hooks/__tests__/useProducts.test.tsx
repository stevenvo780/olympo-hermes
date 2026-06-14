/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useProducts } from '../useProducts';
import { LIMIT_PRODUCTS } from '@/types';

// Mock dependencies
const dispatchMock = vi.fn();
// Mock useSelector
const useSelectorMock = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
  useSelector: (selector: any) => useSelectorMock(selector),
}));

// Mock Actions
vi.mock('@/redux/products', () => ({
  setProductsByCategory: vi.fn((payload) => ({ type: 'products/setPayload', payload })),
  addProductsByCategory: vi.fn((payload) => ({ type: 'products/addPayload', payload })),
  setLoadingProductsByCategory: vi.fn((payload) => ({ type: 'products/setLoading', payload })),
}));

vi.mock('@/redux/ui', () => ({
  addNotification: vi.fn((payload) => ({ type: 'ui/notif', payload })),
}));

// Mock Store
vi.mock('@/redux/store', () => ({
  default: {
    getState: vi.fn(),
  },
}));
import store from '@/redux/store';

// Mock Axios
vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));
import api from '@/utils/axios';

// Mock utils
vi.mock('@/utils/categoryHierarchyUtils', () => ({
  getCategoriesForProductLoading: vi.fn((cats) => cats),
}));

// Imports for assertions
import { setProductsByCategory, addProductsByCategory, setLoadingProductsByCategory } from '@/redux/products';
import { addNotification } from '@/redux/ui';

let container: HTMLDivElement;
let root: Root;
let hookResult: any = {};

const TestComponent = ({ storeId }: { storeId: string }) => {
  const result = useProducts(storeId);
  hookResult = result;
  return null;
};

const renderHook = async (storeId: string) => {
  await act(async () => {
    root.render(<TestComponent storeId={storeId} />);
  });
};

describe('useProducts', () => {
  const baseState = {
    products: {
      filters: { minPrice: 0, maxPrice: 0, discount: '' },
      productsByCategory: {},
      productsByCategoryLoading: {},
    },
    ui: { searchText: '' },
    categories: { categories: [{ id: 1, name: 'Cat1' }] },
  };
  let mockState = JSON.parse(JSON.stringify(baseState));

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    dispatchMock.mockReset();
    mockState = JSON.parse(JSON.stringify(baseState));
    useSelectorMock.mockImplementation((selector) => selector(mockState));
    (store.getState as any).mockReturnValue(mockState);
    (api.get as any).mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('loadProductsByCategory fetches and dispatches setProductsByCategory on initial load', async () => {
    await renderHook('store1');

    // Mock successful response
    const mockResponse = {
      data: {
        products: [{ id: 1 }],
        currentPage: 1,
        totalPages: 2
      }
    };
    (api.get as any).mockResolvedValue(mockResponse);

    await act(async () => {
      await hookResult.loadProductsByCategory(1, false);
    });

    expect(dispatchMock).toHaveBeenCalledWith(setLoadingProductsByCategory({ categoryId: 1, isLoading: true }));
    expect(api.get).toHaveBeenCalled(); // Args need checking but URLSearchParams dynamic
    expect(dispatchMock).toHaveBeenCalledWith(setProductsByCategory({ categoryId: 1, products: [{ id: 1 }] as any, hasMore: true, offset: 0 }));
    expect(dispatchMock).toHaveBeenCalledWith(setLoadingProductsByCategory({ categoryId: 1, isLoading: false }));
  });

  it('loadProductsByCategory uses addProductsByCategory on loadMore', async () => {
    await renderHook('store1');

    const mockResponse = {
      data: {
        products: [{ id: 2 }],
        currentPage: 2,
        totalPages: 2
      }
    };
    (api.get as any).mockResolvedValue(mockResponse);

    await act(async () => {
      await hookResult.loadProductsByCategory(1, true);
    });

    expect(dispatchMock).toHaveBeenCalledWith(addProductsByCategory({ categoryId: 1, products: [{ id: 2 }] as any, hasMore: false, offset: LIMIT_PRODUCTS }));
    // Offset is 0 because store state mock had no offset. 
    // If store state had offset, it would be offset + LIMIT.
  });

  it('returns early when category is missing', async () => {
    mockState.categories.categories = [];
    await renderHook('store1');

    await act(async () => {
      await hookResult.loadProductsByCategory(99, false);
    });

    expect(api.get).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('returns early when category is already loading', async () => {
    mockState.products.productsByCategoryLoading = { 1: true };
    await renderHook('store1');

    await act(async () => {
      await hookResult.loadProductsByCategory(1, false);
    });

    expect(api.get).not.toHaveBeenCalled();
  });

  it('includes filters and search text in query params', async () => {
    mockState.products.filters = { minPrice: 10, maxPrice: 100, discount: '10' };
    mockState.ui.searchText = 'zapatos';
    await renderHook('store1');

    const mockResponse = {
      data: {
        products: [{ id: 1 }],
        currentPage: 1,
        totalPages: 1
      }
    };
    (api.get as any).mockResolvedValue(mockResponse);

    await act(async () => {
      await hookResult.loadProductsByCategory(1, false);
    });

    const calledUrl = (api.get as any).mock.calls[0][0] as string;
    const queryString = calledUrl.split('?')[1];
    const params = new URLSearchParams(queryString);

    expect(params.get('minPrice')).toBe('10');
    expect(params.get('maxPrice')).toBe('100');
    expect(params.get('discount')).toBe('10');
    expect(params.get('text')).toBe('zapatos');
  });

  it('sets hasMore false when loadMore returns no products', async () => {
    mockState.products.productsByCategory = { 1: { products: [{ id: 1 }], offset: LIMIT_PRODUCTS } };
    await renderHook('store1');

    const mockResponse = {
      data: {
        products: [],
        currentPage: 1,
        totalPages: 2
      }
    };
    (api.get as any).mockResolvedValue(mockResponse);

    await act(async () => {
      await hookResult.loadProductsByCategory(1, true);
    });

    expect(dispatchMock).toHaveBeenCalledWith(addProductsByCategory({
      categoryId: 1,
      products: [],
      hasMore: false,
      offset: LIMIT_PRODUCTS * 2,
    }));
  });

  it('warns when filters return no products and existing products are present', async () => {
    mockState.products.productsByCategory = {
      1: { products: [{ id: 1 }], offset: 0 }
    };
    mockState.ui.searchText = '';
    await renderHook('store1');

    const mockResponse = {
      data: {
        products: [],
        currentPage: 1,
        totalPages: 1
      }
    };
    (api.get as any).mockResolvedValue(mockResponse);

    await act(async () => {
      await hookResult.loadProductsByCategory(1, false);
    });

    expect(dispatchMock).toHaveBeenCalledWith(addNotification({
      message: 'No hay productos para este filtro',
      color: 'warning'
    }));
  });

  it('handles error gracefully', async () => {
    await renderHook('store1');

    (api.get as any).mockRejectedValue(new Error('Fail'));

    await act(async () => {
      await hookResult.loadProductsByCategory(1, false);
    });

    expect(dispatchMock).toHaveBeenCalledWith(addNotification({ message: 'Error al cargar productos de Cat1', color: 'error' }));
    expect(dispatchMock).toHaveBeenCalledWith(setLoadingProductsByCategory({ categoryId: 1, isLoading: false }));
  });

  it('reloadAllProductsByCategory triggers load for all categories', async () => {
    await renderHook('store1');

    // Spy on loadProductsByCategory
    // Since it's inside the hook, we can't easily spy on the internal function call directly if we call the exposed one.
    // But we can check api calls.
    const mockResponse = {
      data: {
        products: [],
        currentPage: 1,
        totalPages: 1
      }
    };
    (api.get as any).mockResolvedValue(mockResponse);

    await act(async () => {
      hookResult.reloadAllProductsByCategory();
    });

    expect(api.get).toHaveBeenCalled();
  });

  it('reloadAllProductsByCategory does nothing when categories are empty', async () => {
    mockState.categories.categories = [];
    await renderHook('store1');

    await act(async () => {
      hookResult.reloadAllProductsByCategory();
    });

    expect(api.get).not.toHaveBeenCalled();
  });
});
