/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { sortProductsByCategoryOrder } from '../productOrder';
import { Product } from '@/types';

const makeProduct = (id: number, orderInCategory?: number): Product => ({
  id,
  name: `Product ${id}`,
  orderInCategory,
} as unknown as Product);

describe('productOrder', () => {
  describe('sortProductsByCategoryOrder', () => {
    it('returns empty array for empty input', () => {
      expect(sortProductsByCategoryOrder([])).toEqual([]);
    });

    it('sorts by orderInCategory', () => {
      const products = [
        makeProduct(1, 3),
        makeProduct(2, 1),
        makeProduct(3, 2),
      ];
      const sorted = sortProductsByCategoryOrder(products);
      expect(sorted.map(p => p.id)).toEqual([2, 3, 1]);
    });

    it('puts products without order at end', () => {
      const products = [
        makeProduct(1, undefined),
        makeProduct(2, 1),
        makeProduct(3, undefined),
      ];
      const sorted = sortProductsByCategoryOrder(products);
      expect(sorted[0].id).toBe(2);
    });

    it('sorts by id when orderInCategory is same', () => {
      const products = [
        makeProduct(3, 1),
        makeProduct(1, 1),
        makeProduct(2, 1),
      ];
      const sorted = sortProductsByCategoryOrder(products);
      expect(sorted.map(p => p.id)).toEqual([1, 2, 3]);
    });

    it('does not mutate original array', () => {
      const products = [makeProduct(2, 2), makeProduct(1, 1)];
      const original = [...products];
      sortProductsByCategoryOrder(products);
      expect(products).toEqual(original);
    });

    it('handles single product', () => {
      const products = [makeProduct(1, 1)];
      expect(sortProductsByCategoryOrder(products)).toEqual(products);
    });

    it('handles products with order 0', () => {
      const products = [
        makeProduct(1, 1),
        makeProduct(2, 0),
      ];
      const sorted = sortProductsByCategoryOrder(products);
      expect(sorted[0].id).toBe(2);
    });
  });
});
