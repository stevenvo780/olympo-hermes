'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Config } from '@/types';

interface ConfigState {
  config: Config | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConfigState = {
  config: null,
  loading: false,
  error: null
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfigLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setConfig(state, action: PayloadAction<Config>) {
      state.config = action.payload;
      state.loading = false;
      state.error = null;
    },
    setConfigError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearConfig(state) {
      state.config = null;
      state.error = null;
      state.loading = false;
    }
  }
});

export const { setConfigLoading, setConfig, setConfigError, clearConfig } = configSlice.actions;

export default configSlice.reducer;
