'use client';
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DeliveryZone, Product } from '@/types';
import axios from 'axios';

export const updateCartItemWithHierarchy = createAsyncThunk(
  'cart/updateCartItemWithHierarchy',
  async ({ productId, storeId }: { productId: number; storeId: string }) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${storeId}/${productId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      const completeProduct = response.data;
      
      return { productId, product: completeProduct };
    } catch {
      throw new Error('Error updating cart item hierarchy');
    }
  }
);

export const addToCartWithHierarchy = createAsyncThunk(
  'cart/addToCartWithHierarchy',
  async ({ product, storeId }: { product: Product; storeId: string }) => {
    try {
      const hasCompleteHierarchy = product.parent && 
                                   product.parent.title && 
                                   product.parent.title.length > 3;
      
      if (hasCompleteHierarchy) {
        return { product, storeId };
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${storeId}/${product.id}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );
      
      const completeProduct = response.data;
      
      return { product: completeProduct, storeId };
    } catch {
      return { product, storeId };
    }
  }
);

export interface CartItem {
  product: Product;
  quantity: number;
  finalPrice: number;
}

interface Cart {
  items: CartItem[];
}

interface CartState {
  carts: Record<string, Cart>;
  isOpen: boolean;
  selectedDeliveryZone: DeliveryZone | null;
}

const initialState: CartState = {
  carts: {},
  isOpen: false,
  selectedDeliveryZone: null,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    toggleCart(state) {
      state.isOpen = !state.isOpen;
    },
    addToCart(state, action: PayloadAction<{ product: Product, storeId: string }>) {
      const { product, storeId } = action.payload;
      if (!storeId) return;
      if (!state.carts[storeId]) state.carts[storeId] = { items: [] };
      const cart = state.carts[storeId];
      const productId = product.id;
      const existingItem = cart.items.find(item => item.product.id === productId);
      
      const itemPrice = Number(product.totalPrice || product.basePrice);

      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          existingItem.quantity += 1;
          existingItem.finalPrice = itemPrice * existingItem.quantity;
        }
      } else {
        if (product.stock > 0) {
          cart.items.push({ product, quantity: 1, finalPrice: itemPrice });
        }
      }
    },
    removeItem(state, action: PayloadAction<{ productId: number, storeId: string }>) {
      const { productId, storeId } = action.payload;
      if (!storeId || !state.carts[storeId]) return;
      const cart = state.carts[storeId];
      cart.items = cart.items.filter(item => item.product.id !== productId);
      if (cart.items.length === 0) delete state.carts[storeId];
    },
    clearCart(state, action: PayloadAction<string>) {
      const storeId = action.payload;
      if (storeId && state.carts[storeId]) {
        delete state.carts[storeId];
      }
    },
    incrementQuantity(state, action: PayloadAction<{ productId: number, storeId: string }>) {
      const { productId, storeId } = action.payload;
      if (!storeId || !state.carts[storeId]) return;
      const cart = state.carts[storeId];
      const item = cart.items.find(item => item.product.id === productId);
      if (item) {
        if (item.quantity < item.product.stock) {
          item.quantity++;
          const itemPrice = Number(item.product.totalPrice || item.product.basePrice);
          item.finalPrice = itemPrice * item.quantity;
        }
      }
    },
    decrementQuantity(state, action: PayloadAction<{ productId: number, storeId: string }>) {
      const { productId, storeId } = action.payload;
      if (!storeId || !state.carts[storeId]) return;
      const cart = state.carts[storeId];
      const index = cart.items.findIndex(item => item.product.id === productId);
      if (index !== -1) {
        const item = cart.items[index];
        if (item.quantity > 1) {
          item.quantity--;
          const itemPrice = Number(item.product.totalPrice || item.product.basePrice);
          item.finalPrice = itemPrice * item.quantity;
        } else {
          cart.items.splice(index, 1);
        }
        if (cart.items.length === 0) delete state.carts[storeId];
      }
    },
    setSelectedDeliveryZone(state, action: PayloadAction<DeliveryZone | null>) {
      state.selectedDeliveryZone = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToCartWithHierarchy.fulfilled, (state, action) => {
        const { product, storeId } = action.payload;
        if (!storeId) return;
        if (!state.carts[storeId]) state.carts[storeId] = { items: [] };
        const cart = state.carts[storeId];
        const productId = product.id;
        const existingItem = cart.items.find(item => item.product.id === productId);
        
        const itemPrice = Number(product.totalPrice || product.basePrice);

        if (existingItem) {
          if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
            existingItem.finalPrice = itemPrice * existingItem.quantity;

            existingItem.product = product;
          }
        } else {
          if (product.stock > 0) {
            cart.items.push({ product, quantity: 1, finalPrice: itemPrice });
          }
        }
      })
      .addCase(updateCartItemWithHierarchy.fulfilled, (state, action) => {
        const { product, productId } = action.payload;

        for (const storeId in state.carts) {
          const cart = state.carts[storeId];
          const existingItem = cart.items.find(item => item.product.id === productId);
          
          if (existingItem) {

            existingItem.product = product;
            break;
          }
        }
      });
  },
});

export const {
  toggleCart,
  addToCart,
  removeItem,
  clearCart,
  incrementQuantity,
  decrementQuantity,
  setSelectedDeliveryZone,
} = cartSlice.actions;

export default cartSlice.reducer;
