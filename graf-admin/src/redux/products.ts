'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types';

interface ProductsState {
  allProducts: Record<string, Product[]>;
}

const initialState: ProductsState = {
  allProducts: {}
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<{ storeId: string; products: Product[] }>) {
      const { storeId, products } = action.payload;
      state.allProducts[storeId] = products;
    },
    addProduct(state, action: PayloadAction<{ storeId: string; product: Product }>) {
      const { storeId, product } = action.payload;
      if (!state.allProducts[storeId]) {
        state.allProducts[storeId] = [];
      }
      state.allProducts[storeId].push(product);
    },
    updateProduct(state, action: PayloadAction<{ storeId: string; product: Product }>) {
      const { storeId, product } = action.payload;
      if (state.allProducts[storeId]) {
        const index = state.allProducts[storeId].findIndex(p => p.id === product.id);
        if (index !== -1) {
          state.allProducts[storeId][index] = product;
        }
      }
    },
    deleteProduct(state, action: PayloadAction<{ storeId: string; productId: number }>) {
      const { storeId, productId } = action.payload;
      if (state.allProducts[storeId]) {
        state.allProducts[storeId] = state.allProducts[storeId].filter(p => p.id !== productId);
      }
    }
  }
});

export const { setProducts, addProduct, updateProduct, deleteProduct } = productsSlice.actions;
export default productsSlice.reducer;
