import { describe, expect, it } from 'vitest';
import {
  collectLeafBasePrices,
  getPriceRange,
  hasVariations,
} from '@/utils/productPrice';
import { makeProduct } from './fixtures';

describe('productPrice', () => {
  it('collects leaf base prices and computes range', () => {
    const leafA = makeProduct({ id: 1, basePrice: 10 });
    const leafB = makeProduct({ id: 2, basePrice: 15 });
    const parent = makeProduct({ id: 3, children: [leafA, leafB] });

    expect(collectLeafBasePrices(parent)).toEqual([10, 15]);
    expect(getPriceRange(parent)).toEqual({ min: 10, max: 15 });
  });

  it('falls back to 0 when no prices are available', () => {
    const leaf = makeProduct({ id: 4, basePrice: undefined, priceWithTax: undefined });

    expect(collectLeafBasePrices(leaf)).toEqual([0]);
  });

  it('uses priceWithTax when basePrice is missing', () => {
    const leaf = {
      id: 5,
      basePrice: undefined,
      priceWithTax: 42,
      children: [],
    } as any;

    expect(collectLeafBasePrices(leaf)).toEqual([42]);
  });

  it('detects variations based on children', () => {
    const leaf = makeProduct({ id: 1 });
    const parent = makeProduct({ id: 2, children: [leaf] });

    expect(hasVariations(parent)).toBe(true);
    expect(hasVariations(leaf)).toBe(false);
  });
});
