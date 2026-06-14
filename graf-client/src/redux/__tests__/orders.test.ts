import { describe, expect, it } from 'vitest';
import ordersReducer, {
  fetchOrdersFailure,
  fetchOrdersStart,
  fetchOrdersSuccess,
  resetOrder,
} from '@/redux/orders';
import type { Order } from '@/types';

describe('orders slice', () => {
  it('handles order fetching lifecycle', () => {
    let state = ordersReducer(undefined, { type: 'init' });
    state = ordersReducer(state, fetchOrdersStart());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    const order = { id: 1 } as Order;
    state = ordersReducer(state, fetchOrdersSuccess({ orders: [order], total: 1 }));

    expect(state.loading).toBe(false);
    expect(state.orders).toEqual([order]);
    expect(state.totalOrders).toBe(1);

    state = ordersReducer(state, fetchOrdersFailure('error'));
    expect(state.loading).toBe(false);
    expect(state.error).toBe('error');
    expect(state.orders).toEqual([]);
    expect(state.totalOrders).toBe(0);
  });

  it('defaults missing orders payload fields', () => {
    let state = ordersReducer(undefined, { type: 'init' });
    state = ordersReducer(state, fetchOrdersSuccess({} as { orders?: Order[]; total?: number }));

    expect(state.orders).toEqual([]);
    expect(state.totalOrders).toBe(0);
  });

  it('resets order state', () => {
    const seeded = {
      orders: [{ id: 1 } as Order],
      totalOrders: 1,
      loading: true,
      error: 'error',
    };

    const state = ordersReducer(seeded, resetOrder());

    expect(state.orders).toEqual([]);
    expect(state.totalOrders).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});
