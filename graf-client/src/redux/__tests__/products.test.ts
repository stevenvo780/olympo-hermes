import { describe, expect, it } from 'vitest';
import productsReducer, {
  addProductsByCategory,
  setActiveRange,
  setCategoryViewMode,
  setFilters,
  setLoadingFilters,
  setLoadingProductsByCategory,
  setProductsByCategory,
  setQuickFilterLabels,
} from '@/redux/products';
import { makeProduct } from '@/utils/__tests__/fixtures';

describe('products slice', () => {
  it('updates filters and view modes when category is selected', () => {
    const initialState = productsReducer(undefined, { type: 'init' });
    const seeded = {
      ...initialState,
      viewModes: {
        1: 'carousel',
        2: 'carousel',
      },
    };

    const state = productsReducer(seeded as any, setFilters({ category: '2', minPrice: 10 }));

    expect(state.filters.category).toBe('2');
    expect(state.filters.minPrice).toBe(10);
    expect(state.viewModes[1]).toBe('carousel');
    expect(state.viewModes[2]).toBe('grid');
  });

  it('resets view modes when category filter is cleared', () => {
    const initialState = productsReducer(undefined, { type: 'init' });
    const seeded = {
      ...initialState,
      viewModes: {
        1: 'grid',
        2: 'list',
      },
    };

    const state = productsReducer(seeded as any, setFilters({ category: '' }));

    expect(state.viewModes[1]).toBe('carousel');
    expect(state.viewModes[2]).toBe('carousel');
  });

  it('updates view mode and active range', () => {
    let state = productsReducer(undefined, { type: 'init' });
    state = productsReducer(state, setCategoryViewMode({ categoryId: 5, viewMode: 'list' }));
    state = productsReducer(state, setActiveRange('medium'));

    expect(state.viewModes[5]).toBe('list');
    expect(state.activeRange).toBe('medium');
  });

  it('sets and appends products by category', () => {
    const productA = makeProduct({ id: 1 });
    const productB = makeProduct({ id: 2 });

    let state = productsReducer(undefined, { type: 'init' });
    state = productsReducer(
      state,
      setProductsByCategory({ categoryId: 10, products: [productA], hasMore: true, offset: 1 }),
    );

    state = productsReducer(
      state,
      addProductsByCategory({ categoryId: 10, products: [productB], hasMore: false, offset: 2 }),
    );

    expect(state.productsByCategory[10].products).toEqual([productA, productB]);
    expect(state.productsByCategory[10].hasMore).toBe(false);
    expect(state.productsByCategory[10].offset).toBe(2);
  });

  it('adds products when category has no existing entry', () => {
    const productA = makeProduct({ id: 3 });

    const state = productsReducer(
      undefined,
      addProductsByCategory({ categoryId: 99, products: [productA], hasMore: true, offset: 1 }),
    );

    expect(state.productsByCategory[99].products).toEqual([productA]);
    expect(state.productsByCategory[99].hasMore).toBe(true);
  });

  it('updates loading flags and quick filter labels', () => {
    let state = productsReducer(undefined, { type: 'init' });
    state = productsReducer(state, setLoadingProductsByCategory({ categoryId: 3, isLoading: true }));
    state = productsReducer(
      state,
      setQuickFilterLabels({ lowest: 'Low', low: 'Mid', medium: 'High', high: 'Max' }),
    );
    state = productsReducer(state, setLoadingFilters(true));

    expect(state.productsByCategoryLoading[3]).toBe(true);
    expect(state.quickFilterLabels.high).toBe('Max');
    expect(state.loadingFilters).toBe(true);
  });
});
