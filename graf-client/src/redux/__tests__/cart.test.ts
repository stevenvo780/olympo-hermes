import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import cartReducer, {
  addToCart,
  addToCartWithHierarchy,
  clearCart,
  decrementQuantity,
  incrementQuantity,
  removeItem,
  setSelectedDeliveryZone,
  toggleCart,
  updateCartItemWithHierarchy,
} from '@/redux/cart';
import { makeDeliveryZone, makeProduct } from '@/utils/__tests__/fixtures';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));

const mockGet = axios.get as unknown as ReturnType<typeof vi.fn>;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

describe('cart reducers', () => {
  afterEach(() => {
    vi.clearAllMocks();
    if (originalApiUrl === undefined) {
      delete (process.env as any).NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it('toggles cart open state', () => {
    let state = cartReducer(undefined, { type: 'init' });

    state = cartReducer(state, toggleCart());
    expect(state.isOpen).toBe(true);

    state = cartReducer(state, toggleCart());
    expect(state.isOpen).toBe(false);
  });

  it('adds items and respects stock limits', () => {
    const storeId = 'store-1';
    const product = makeProduct({ id: 1, stock: 2, totalPrice: 10, basePrice: 10 });

    let state = cartReducer(undefined, { type: 'init' });
    state = cartReducer(state, addToCart({ product, storeId }));
    state = cartReducer(state, addToCart({ product, storeId }));
    state = cartReducer(state, addToCart({ product, storeId }));

    expect(state.carts[storeId].items[0].quantity).toBe(2);
    expect(state.carts[storeId].items[0].finalPrice).toBe(20);
  });

  it('uses base price when total price is missing', () => {
    const storeId = 'store-1';
    const product = makeProduct({ id: 9, stock: 2, totalPrice: 0, basePrice: 5 });

    let state = cartReducer(undefined, { type: 'init' });
    state = cartReducer(state, addToCart({ product, storeId }));
    state = cartReducer(state, incrementQuantity({ productId: product.id, storeId }));

    expect(state.carts[storeId].items[0].finalPrice).toBe(10);
  });

  it('skips adding items when store id is missing or stock is zero', () => {
    const storeId = '';
    const outOfStock = makeProduct({ id: 5, stock: 0, totalPrice: 10 });

    let state = cartReducer(undefined, { type: 'init' });
    state = cartReducer(state, addToCart({ product: outOfStock, storeId }));

    expect(state.carts).toEqual({});

    state = cartReducer(state, addToCart({ product: outOfStock, storeId: 'store-2' }));
    expect(state.carts['store-2'].items).toEqual([]);
  });

  it('removes items and clears carts', () => {
    const storeId = 'store-1';
    const product = makeProduct({ id: 1, stock: 1, totalPrice: 10, basePrice: 10 });
    const another = makeProduct({ id: 2, stock: 1, totalPrice: 5, basePrice: 5 });

    let state = cartReducer(undefined, { type: 'init' });
    state = cartReducer(state, addToCart({ product, storeId }));
    state = cartReducer(state, removeItem({ productId: product.id, storeId }));

    expect(state.carts[storeId]).toBeUndefined();

    state = cartReducer(state, addToCart({ product, storeId }));
    state = cartReducer(state, addToCart({ product: another, storeId }));
    state = cartReducer(state, removeItem({ productId: product.id, storeId }));
    expect(state.carts[storeId].items).toHaveLength(1);

    state = cartReducer(state, clearCart(storeId));

    expect(state.carts[storeId]).toBeUndefined();
  });

  it('increments and decrements quantities', () => {
    const storeId = 'store-1';
    const product = makeProduct({ id: 1, stock: 2, totalPrice: 10, basePrice: 10 });

    let state = cartReducer(undefined, { type: 'init' });
    state = cartReducer(state, addToCart({ product, storeId }));
    state = cartReducer(state, incrementQuantity({ productId: product.id, storeId }));
    state = cartReducer(state, incrementQuantity({ productId: product.id, storeId }));

    expect(state.carts[storeId].items[0].quantity).toBe(2);

    state = cartReducer(state, decrementQuantity({ productId: product.id, storeId }));
    expect(state.carts[storeId].items[0].quantity).toBe(1);

    state = cartReducer(state, decrementQuantity({ productId: product.id, storeId }));
    expect(state.carts[storeId]).toBeUndefined();
  });

  it('uses base price when decrementing totals', () => {
    const storeId = 'store-1';
    const product = makeProduct({ id: 7, stock: 3, totalPrice: 0, basePrice: 4 });

    let state = cartReducer(undefined, { type: 'init' });
    state = cartReducer(state, addToCart({ product, storeId }));
    state = cartReducer(state, incrementQuantity({ productId: product.id, storeId }));
    state = cartReducer(state, decrementQuantity({ productId: product.id, storeId }));

    expect(state.carts[storeId].items[0].finalPrice).toBe(4);
  });

  it('handles delivery zone selection', () => {
    const zone = makeDeliveryZone({ id: 1, price: 5 });
    let state = cartReducer(undefined, { type: 'init' });

    state = cartReducer(state, setSelectedDeliveryZone(zone));
    expect(state.selectedDeliveryZone).toEqual(zone);
  });

  it('ignores actions when store is missing', () => {
    let state = cartReducer(undefined, { type: 'init' });

    state = cartReducer(state, removeItem({ productId: 1, storeId: '' }));
    state = cartReducer(state, incrementQuantity({ productId: 1, storeId: '' }));
    state = cartReducer(state, decrementQuantity({ productId: 1, storeId: '' }));
    state = cartReducer(state, clearCart(''));

    const action = addToCartWithHierarchy.fulfilled(
      { product: makeProduct({ id: 10 }), storeId: '' },
      'req-4',
      { product: makeProduct({ id: 10 }), storeId: '' },
    );
    state = cartReducer(state, action);

    expect(state.carts).toEqual({});
  });

  it('ignores actions when cart or item is missing', () => {
    let state = cartReducer(undefined, { type: 'init' });

    state = cartReducer(state, removeItem({ productId: 1, storeId: 'store-3' }));
    state = cartReducer(state, clearCart('store-3'));
    state = cartReducer(state, incrementQuantity({ productId: 1, storeId: 'store-3' }));
    state = cartReducer(state, decrementQuantity({ productId: 1, storeId: 'store-3' }));

    const product = makeProduct({ id: 1, stock: 2, totalPrice: 10 });
    state = cartReducer(state, addToCart({ product, storeId: 'store-3' }));

    state = cartReducer(state, incrementQuantity({ productId: 999, storeId: 'store-3' }));
    state = cartReducer(state, decrementQuantity({ productId: 999, storeId: 'store-3' }));

    expect(state.carts['store-3'].items).toHaveLength(1);
  });

  it('handles fulfilled addToCartWithHierarchy actions', () => {
    const storeId = 'store-1';
    const existing = makeProduct({ id: 1, stock: 3, totalPrice: 8, basePrice: 8 });
    const updated = makeProduct({ id: 1, stock: 3, totalPrice: 12, basePrice: 12 });

    const state = {
      carts: {
        [storeId]: {
          items: [{ product: existing, quantity: 1, finalPrice: 8 }],
        },
      },
      isOpen: false,
      selectedDeliveryZone: null,
    };

    const action = addToCartWithHierarchy.fulfilled(
      { product: updated, storeId },
      'req-1',
      { product: updated, storeId },
    );

    const next = cartReducer(state, action);
    expect(next.carts[storeId].items[0].quantity).toBe(2);
    expect(next.carts[storeId].items[0].finalPrice).toBe(24);
    expect(next.carts[storeId].items[0].product).toBe(updated);

    const maxed = {
      carts: {
        [storeId]: {
          items: [{ product: updated, quantity: 3, finalPrice: 36 }],
        },
      },
      isOpen: false,
      selectedDeliveryZone: null,
    };
    const maxedAction = addToCartWithHierarchy.fulfilled(
      { product: updated, storeId },
      'req-max',
      { product: updated, storeId },
    );
    const maxedNext = cartReducer(maxed, maxedAction);
    expect(maxedNext.carts[storeId].items[0].quantity).toBe(3);

    const newProduct = makeProduct({ id: 2, stock: 0, totalPrice: 5, basePrice: 5 });
    const addAction = addToCartWithHierarchy.fulfilled(
      { product: newProduct, storeId },
      'req-2',
      { product: newProduct, storeId },
    );

    const nextAfterNew = cartReducer(next, addAction);
    expect(nextAfterNew.carts[storeId].items).toHaveLength(1);

    const inStock = makeProduct({ id: 3, stock: 2, totalPrice: 6, basePrice: 6 });
    const addInStock = addToCartWithHierarchy.fulfilled(
      { product: inStock, storeId },
      'req-5',
      { product: inStock, storeId },
    );

    const nextAfterInStock = cartReducer(nextAfterNew, addInStock);
    expect(nextAfterInStock.carts[storeId].items).toHaveLength(2);

    const basePriceProduct = makeProduct({ id: 4, stock: 1, totalPrice: 0, basePrice: 7 });
    const addBasePrice = addToCartWithHierarchy.fulfilled(
      { product: basePriceProduct, storeId },
      'req-6',
      { product: basePriceProduct, storeId },
    );
    const nextAfterBase = cartReducer(nextAfterInStock, addBasePrice);
    const added = nextAfterBase.carts[storeId].items.find(item => item.product.id === 4);
    expect(added?.finalPrice).toBe(7);

    const emptyState = {
      carts: {},
      isOpen: false,
      selectedDeliveryZone: null,
    };
    const emptyAction = addToCartWithHierarchy.fulfilled(
      { product: inStock, storeId },
      'req-empty',
      { product: inStock, storeId },
    );
    const created = cartReducer(emptyState, emptyAction);
    expect(created.carts[storeId].items).toHaveLength(1);
  });

  it('updates cart items with hierarchy refresh', () => {
    const storeId = 'store-1';
    const existing = makeProduct({ id: 1, title: 'Old', totalPrice: 10 });
    const refreshed = makeProduct({ id: 1, title: 'New', totalPrice: 10 });

    const state = {
      carts: {
        [storeId]: {
          items: [{ product: existing, quantity: 1, finalPrice: 10 }],
        },
      },
      isOpen: false,
      selectedDeliveryZone: null,
    };

    const action = updateCartItemWithHierarchy.fulfilled(
      { productId: 1, product: refreshed },
      'req-3',
      { productId: 1, storeId },
    );

    const next = cartReducer(state, action);
    expect(next.carts[storeId].items[0].product).toBe(refreshed);
  });

  it('does not update items when hierarchy refresh misses', () => {
    const storeId = 'store-1';
    const existing = makeProduct({ id: 1, title: 'Old', totalPrice: 10 });

    const state = {
      carts: {
        [storeId]: {
          items: [{ product: existing, quantity: 1, finalPrice: 10 }],
        },
      },
      isOpen: false,
      selectedDeliveryZone: null,
    };

    const action = updateCartItemWithHierarchy.fulfilled(
      { productId: 99, product: makeProduct({ id: 99, title: 'Missing' }) },
      'req-6',
      { productId: 99, storeId },
    );

    const next = cartReducer(state, action);
    expect(next.carts[storeId].items[0].product).toBe(existing);
  });
});

describe('cart thunks', () => {
  afterEach(() => {
    vi.clearAllMocks();
    if (originalApiUrl === undefined) {
      delete (process.env as any).NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it('fetches product when hierarchy is incomplete', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost';
    const storeId = 'store-1';
    const product = makeProduct({ id: 1 });
    const complete = makeProduct({ id: 1, title: 'Complete' });

    mockGet.mockResolvedValueOnce({ data: complete });

    const dispatch = vi.fn();
    const getState = vi.fn();
    const action = await addToCartWithHierarchy({ product, storeId })(
      dispatch,
      getState,
      undefined,
    );

    expect(mockGet).toHaveBeenCalledWith(
      'http://localhost/products/store-1/1',
      expect.any(Object),
    );
    expect(action.type).toContain('fulfilled');
    expect(action.payload).toEqual({ product: complete, storeId });
  });

  it('fetches product when parent title is too short', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost';
    const storeId = 'store-1';
    const parent = makeProduct({ id: 11, title: 'No' });
    const product = makeProduct({ id: 12, parent });
    const complete = makeProduct({ id: 12, title: 'Complete' });

    mockGet.mockResolvedValueOnce({ data: complete });

    const dispatch = vi.fn();
    const getState = vi.fn();
    const action = await addToCartWithHierarchy({ product, storeId })(
      dispatch,
      getState,
      undefined,
    );

    expect(action.type).toContain('fulfilled');
    expect(action.payload).toEqual({ product: complete, storeId });
  });

  it('skips fetch when hierarchy is complete', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost';
    const storeId = 'store-1';
    const parent = makeProduct({ id: 10, title: 'Parent' });
    const product = makeProduct({ id: 2, parent });

    const dispatch = vi.fn();
    const getState = vi.fn();
    const action = await addToCartWithHierarchy({ product, storeId })(
      dispatch,
      getState,
      undefined,
    );

    expect(mockGet).not.toHaveBeenCalled();
    expect(action.payload).toEqual({ product, storeId });
  });

  it('returns original product when fetch fails', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost';
    const storeId = 'store-1';
    const product = makeProduct({ id: 3 });

    mockGet.mockRejectedValueOnce(new Error('network error'));

    const dispatch = vi.fn();
    const getState = vi.fn();
    const action = await addToCartWithHierarchy({ product, storeId })(
      dispatch,
      getState,
      undefined,
    );

    expect(action.type).toContain('fulfilled');
    expect(action.payload).toEqual({ product, storeId });
  });

  it('updates cart item with hierarchy when fetch succeeds', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost';
    const storeId = 'store-1';
    const complete = makeProduct({ id: 4, title: 'Complete' });

    mockGet.mockResolvedValueOnce({ data: complete });

    const dispatch = vi.fn();
    const getState = vi.fn();
    const action = await updateCartItemWithHierarchy({ productId: 4, storeId })(
      dispatch,
      getState,
      undefined,
    );

    expect(action.type).toContain('fulfilled');
    expect(action.payload).toEqual({ productId: 4, product: complete });
  });

  it('rejects hierarchy update when fetch fails', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost';
    const storeId = 'store-1';

    mockGet.mockRejectedValueOnce(new Error('network error'));

    const dispatch = vi.fn();
    const getState = vi.fn();
    const action = await updateCartItemWithHierarchy({ productId: 5, storeId })(
      dispatch,
      getState,
      undefined,
    );

    expect(action.type).toContain('rejected');
  });
});
