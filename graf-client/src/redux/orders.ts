import { createSlice } from '@reduxjs/toolkit';
import { Order } from '@/types';

interface OrdersState {
  orders: Order[];
  totalOrders: number;
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  totalOrders: 0,
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    resetOrder(state) {
      state.orders = [];
      state.totalOrders = 0;
      state.loading = false;
      state.error = null;
    },
    fetchOrdersStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess(state, action) {
      state.loading = false;
      state.orders = action.payload.orders || [];
      state.totalOrders = action.payload.total || 0;
    },
    fetchOrdersFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.orders = [];
      state.totalOrders = 0;
    },
  },
});

export const { resetOrder, fetchOrdersStart, fetchOrdersSuccess, fetchOrdersFailure } = ordersSlice.actions;

export default ordersSlice.reducer;