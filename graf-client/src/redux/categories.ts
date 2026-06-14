'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category } from '@/types';

interface CategoriesState {
  categories: Category[];
  categoriesHierarchy: Category[];
  rootCategories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  categoriesHierarchy: [],
  rootCategories: [],
  loading: false,
  error: null
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setCategories(state, action: PayloadAction<Category[]>) {
      state.categories = action.payload;
    },
    setCategoriesHierarchy(state, action: PayloadAction<Category[]>) {
      state.categoriesHierarchy = action.payload;
    },
    setRootCategories(state, action: PayloadAction<Category[]>) {
      state.rootCategories = action.payload;
    },
    setLoadingCategories(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  }
});

export const { setCategories, setCategoriesHierarchy, setRootCategories, setLoadingCategories } = categoriesSlice.actions;

export default categoriesSlice.reducer;
