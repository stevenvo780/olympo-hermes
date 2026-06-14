'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, ProductViewVariant } from '@/types';

interface Filters {
  minPrice: number;
  maxPrice: number;
  category: string;
  discount: string;
}

interface QuickFilterLabels {
  lowest: string;
  low: string;
  medium: string;
  high: string;
}

export interface ProductsState {
  filters: Filters;
  quickFilterLabels: QuickFilterLabels;
  loadingFilters: boolean;
  viewModes: { [categoryId: string]: ProductViewVariant };
  activeRange: '' | 'lowest' | 'low' | 'medium' | 'high';
  productsByCategory: Record<string, {
    products: Product[];
    hasMore: boolean;
    offset: number;
  }>;
  productsByCategoryLoading: Record<string, boolean>;
}

const initialState: ProductsState = {
  filters: { minPrice: 0, maxPrice: 0, category: '', discount: '' },
  quickFilterLabels: { lowest: '', low: '', medium: '', high: '' },
  loadingFilters: false,
  viewModes: {},
  activeRange: '',
  productsByCategory: {},
  productsByCategoryLoading: {},
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<Filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      if (action.payload.category) {
        const catIdNum = parseInt(action.payload.category, 10);
        Object.keys(state.viewModes).forEach((key) => {
          const id = parseInt(key, 10);
          state.viewModes[id] = id === catIdNum ? 'grid' : 'carousel';
        });
      } else {
        Object.keys(state.viewModes).forEach((categoryId) => {
          state.viewModes[categoryId] = 'carousel';
        });
      }
    },
    setCategoryViewMode: (state, action: PayloadAction<{ categoryId: number; viewMode: ProductViewVariant }>) => {
      const { categoryId, viewMode } = action.payload;
      state.viewModes[categoryId] = viewMode;
    },
    setActiveRange: (state, action: PayloadAction<'' | 'lowest' | 'low' | 'medium' | 'high'>) => {
      state.activeRange = action.payload;
    },
    setProductsByCategory: (state, action: PayloadAction<{ categoryId: number; products: Product[], hasMore: boolean, offset: number }>) => {
      const { categoryId, products, hasMore, offset } = action.payload;
      state.productsByCategory[categoryId] = { products, hasMore, offset };
    },
    addProductsByCategory: (state, action: PayloadAction<{ categoryId: number; products: Product[], hasMore: boolean, offset: number }>) => {
      const { categoryId, products, hasMore, offset } = action.payload;
      state.productsByCategory[categoryId] = {
        products: [...(state.productsByCategory[categoryId]?.products || []), ...products],
        hasMore,
        offset
      };
    },
    setLoadingProductsByCategory: (state, action: PayloadAction<{ categoryId: number; isLoading: boolean }>) => {
      const { categoryId, isLoading } = action.payload;
      state.productsByCategoryLoading[categoryId] = isLoading;
    },
    setQuickFilterLabels: (state, action: PayloadAction<QuickFilterLabels>) => {
      state.quickFilterLabels = action.payload;
    },
    setLoadingFilters: (state, action: PayloadAction<boolean>) => {
      state.loadingFilters = action.payload;
    },
  }
});

export const {
  setFilters,
  setCategoryViewMode,
  setActiveRange,
  setProductsByCategory,
  setLoadingProductsByCategory,
  setQuickFilterLabels,
  setLoadingFilters,
  addProductsByCategory
} = productsSlice.actions;
export default productsSlice.reducer;