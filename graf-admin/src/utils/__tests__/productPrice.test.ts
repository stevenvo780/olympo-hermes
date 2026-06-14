import { describe, expect, it } from 'vitest';

import type { Product, Store } from '@/types';
import { collectLeafBasePrices, getPriceRange, hasVariations } from '../productPrice';

const store = {} as Store;

const makeProduct = (overrides: Partial<Product>): Product => ({
  id: 1,
  title: 'Test Product',
  basePrice: 0,
  stock: null,
  sku: 'sku',
  store,
  ...overrides,
});

describe('productPrice utils', () => {
  it('collects leaf prices from nested products', () => {
    const leafA = makeProduct({ id: 2, basePrice: 10, sku: 'a' });
    const leafB = makeProduct({ id: 3, basePrice: 20, sku: 'b' });
    const nested = makeProduct({ id: 4, basePrice: 5, sku: 'c', children: [leafB] });
    const root = makeProduct({ id: 1, basePrice: 0, sku: 'root', children: [leafA, nested] });

    expect(collectLeafBasePrices(root)).toEqual([10, 20]);
  });

  it('falls back to 0 when basePrice is not numeric', () => {
    const leaf = makeProduct({ id: 5, basePrice: Number.NaN, sku: 'nan' });
    expect(collectLeafBasePrices(leaf)).toEqual([0]);
  });

  it('computes the price range from leaf nodes', () => {
    const leafA = makeProduct({ id: 2, basePrice: 8, sku: 'a' });
    const leafB = makeProduct({ id: 3, basePrice: 12, sku: 'b' });
    const root = makeProduct({ id: 1, basePrice: 0, sku: 'root', children: [leafA, leafB] });

    expect(getPriceRange(root)).toEqual({ min: 8, max: 12 });
  });

  it('detects variations based on children', () => {
    const leaf = makeProduct({ id: 6, basePrice: 5, sku: 'leaf' });
    const parent = makeProduct({ id: 7, basePrice: 0, sku: 'parent', children: [leaf] });

    expect(hasVariations(parent)).toBe(true);
    expect(hasVariations(leaf)).toBe(false);
    expect(hasVariations(makeProduct({ id: 8, basePrice: 0, sku: 'empty', children: [] }))).toBe(false);
  });
});
