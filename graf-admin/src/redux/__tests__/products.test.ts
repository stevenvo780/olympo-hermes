import { describe, expect, it } from 'vitest';

import type { Product, Store } from '../../types';
import productsReducer, { addProduct, deleteProduct, setProducts, updateProduct } from '../products';

const store = {} as Store;

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  title: 'Test Product',
  basePrice: 10,
  stock: 2,
  sku: 'sku',
  store,
  ...overrides,
});

describe('products reducer', () => {
  it('sets products for a store', () => {
    const products = [makeProduct({ id: 1 }), makeProduct({ id: 2 })];
    const state = productsReducer(undefined, setProducts({ storeId: 's1', products }));

    expect(state.allProducts.s1).toEqual(products);
  });

  it('adds a product when store list does not exist', () => {
    const product = makeProduct({ id: 3 });
    const state = productsReducer(undefined, addProduct({ storeId: 's2', product }));

    expect(state.allProducts.s2).toEqual([product]);
  });

  it('updates a product in the store list', () => {
    const product = makeProduct({ id: 4, title: 'Old' });
    const updated = makeProduct({ id: 4, title: 'New' });
    const initial = productsReducer(undefined, setProducts({ storeId: 's3', products: [product] }));
    const next = productsReducer(initial, updateProduct({ storeId: 's3', product: updated }));

    expect(next.allProducts.s3[0].title).toBe('New');
  });

  it('deletes a product from the store list', () => {
    const product = makeProduct({ id: 5 });
    const initial = productsReducer(undefined, setProducts({ storeId: 's4', products: [product] }));
    const next = productsReducer(initial, deleteProduct({ storeId: 's4', productId: 5 }));

    expect(next.allProducts.s4).toEqual([]);
  });
});
