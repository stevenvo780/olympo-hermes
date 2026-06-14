'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import { Config } from '../types';

interface Notification {
  id?: string;
  color?: string;
  message: string;
}
interface State {
  loading: boolean;
  notifications: Notification[];
  config: Config | null;
  sidebarCollapsed: boolean;
  isMobileSidebarVisible: boolean;
}

const initialState: State = {
  loading: false,
  notifications: [],
  config: null,
  sidebarCollapsed: true,
  isMobileSidebarVisible: false
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
    setConfig(state, action: PayloadAction<Config>) {
      state.config = action.payload;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setMobileSidebarVisible(state, action: PayloadAction<boolean>) {
      state.isMobileSidebarVisible = action.payload;
    },
    toggleSidebar(state) {
      if (window.innerWidth < 992) {
        state.isMobileSidebarVisible = !state.isMobileSidebarVisible;
      } else {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }
    },
  },
});

export const {
  loading,
  addNotification,
  removeNotification,
  setConfig,
  setSidebarCollapsed,
  setMobileSidebarVisible,
  toggleSidebar,
} = ui.actions;

export default ui.reducer;
