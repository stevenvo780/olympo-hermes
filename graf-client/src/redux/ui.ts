'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import { Store } from '../types';

interface Notification {
  id?: string;
  color?: string;
  message: string;
}

interface State {
  loading: boolean;
  notifications: Notification[];
  store: Store | null;
  searchText: string;
  modalFilters: boolean;
  cachedImages: Record<string, number>;
  showFilterSidebar: boolean;
  cartOpen: boolean;
  
}

const initialState: State = {
  loading: false,
  notifications: [],
  store: null,
  searchText: '',
  modalFilters: false,
  cachedImages: {},
  showFilterSidebar: false,
  cartOpen: false,
  
};

const ui = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    loading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.push({
        id: uuid(),
        message: action.payload.message,
        color: action.payload.color,
      });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    setStore(state, action: PayloadAction<Store>) {
      state.store = action.payload;
    },
    setSearchText(state, action: PayloadAction<string>) {
      state.searchText = action.payload;
    },
    setShowModalFilters(state, action: PayloadAction<boolean>) {
      state.modalFilters = action.payload;
    },
    addCachedImage(state, action: PayloadAction<string>) {
      state.cachedImages[action.payload] = Date.now();
    },
    clearImageCache(state) {
      state.cachedImages = {};
    },
    toggleFilterSidebar(state, action: PayloadAction<boolean | undefined>) {
      state.showFilterSidebar = action.payload !== undefined ? action.payload : !state.showFilterSidebar;
    },
    openCart(state) {
      state.cartOpen = true;
    },
    closeCart(state) {
      state.cartOpen = false;
    },
    
  },
});

export const {
  loading,
  addNotification,
  removeNotification,
  setSearchText,
  setStore,
  setShowModalFilters,
  addCachedImage,
  clearImageCache,
  toggleFilterSidebar,
  openCart,
  closeCart,
} = ui.actions;

export default ui.reducer;
