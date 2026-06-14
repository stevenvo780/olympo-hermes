'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Store } from '../types';

interface State {
  commerces: Store[];
}

const initialState: State = {
  commerces: [],
};

const commerces = createSlice({
  name: 'commerces',
  initialState,
  reducers: {
    setCommerces(state, action: PayloadAction<Store[]>) {
      state.commerces = action.payload;
    },
    removeCommerce(state, action: PayloadAction<string>) {
      state.commerces = state.commerces.filter(
        (commerce) => commerce.id !== action.payload
      );
    },
  },
});

export const { setCommerces, removeCommerce } = commerces.actions;
export default commerces.reducer;
