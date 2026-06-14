import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Config } from '../types';

interface ConfigState {
  config: Config | null;
}

const initialState: ConfigState = {
  config: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig(state, action: PayloadAction<Config>) {
      state.config = action.payload;
    },
    updateConfig(state, action: PayloadAction<Config>) {
      state.config = action.payload;
    },
  },
});

export const { setConfig, updateConfig } = configSlice.actions;
export default configSlice.reducer;