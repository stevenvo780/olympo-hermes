/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  calculateProductTotalQuantity,
  calculateParentProductQuantity,
  hasSelectedVariations,
  getAllDescendantIds,
  findRootProduct,
  isDescendantOf,
} from '../cartVariationsUtils';
import { Product } from '@/types';
import { CartItem } from '@/redux/cart';

const makeProduct = (id: number, overrides: Partial<Product> = {}): Product => ({
  id,
  name: `Product ${id}`,
  basePrice: 100,
  description: 'Test',
  isActive: true,
  isAvailable: true,
  ...overrides,
} as Product);

describe('cartVariationsUtils', () => {
  describe('calculateProductTotalQuantity', () => {
    it('returns 0 for null product', () => {
      const result = calculateProductTotalQuantity(null as any, []);
      expect(result).toBe(0);
    });

    it('returns 0 for null cartItems', () => {
      const product = makeProduct(1);
      const result = calculateProductTotalQuantity(product, null as any);
      expect(result).toBe(0);
    });

    it('returns 0 when product not in cart', () => {
      const product = makeProduct(1);
      const cartItems: CartItem[] = [];
      const result = calculateProductTotalQuantity(product, cartItems);
      expect(result).toBe(0);
    });

    it('returns direct quantity when product in cart', () => {
      const product = makeProduct(1);
      const cartItems: CartItem[] = [
        { product, quantity: 3, finalPrice: 100 },
      ];
      const result = calculateProductTotalQuantity(product, cartItems);
      expect(result).toBe(3);
    });

    it('sums children quantities', () => {
      const child1 = makeProduct(2);
      const child2 = makeProduct(3);
      const parent = makeProduct(1, { children: [child1, child2] });
      const cartItems: CartItem[] = [
        { product: child1, quantity: 2, finalPrice: 100 },
        { product: child2, quantity: 3, finalPrice: 100 },
      ];
      const result = calculateProductTotalQuantity(parent, cartItems);
      expect(result).toBe(5);
    });

    it('handles nested children', () => {
      const grandchild = makeProduct(3);
      const child = makeProduct(2, { children: [grandchild] });
      const parent = makeProduct(1, { children: [child] });
      const cartItems: CartItem[] = [
        { product: grandchild, quantity: 4, finalPrice: 100 },
      ];
      const result = calculateProductTotalQuantity(parent, cartItems);
      expect(result).toBe(4);
    });
  });

  describe('calculateParentProductQuantity', () => {
    it('delegates to calculateProductTotalQuantity', () => {
      const product = makeProduct(1);
      const cartItems: CartItem[] = [{ product, quantity: 5, finalPrice: 100 }];
      const result = calculateParentProductQuantity(product, cartItems);
      expect(result).toBe(5);
    });
  });

  describe('hasSelectedVariations', () => {
    it('returns false when quantity is 0', () => {
      const product = makeProduct(1);
      const result = hasSelectedVariations(product, []);
      expect(result).toBe(false);
    });

    it('returns true when quantity > 0', () => {
      const product = makeProduct(1);
      const cartItems: CartItem[] = [{ product, quantity: 1, finalPrice: 100 }];
      const result = hasSelectedVariations(product, cartItems);
      expect(result).toBe(true);
    });
  });

  describe('getAllDescendantIds', () => {
    it('returns own id for leaf product', () => {
      const product = makeProduct(5);
      const result = getAllDescendantIds(product);
      expect(result).toEqual([5]);
    });

    it('returns children ids', () => {
      const child1 = makeProduct(2);
      const child2 = makeProduct(3);
      const parent = makeProduct(1, { children: [child1, child2] });
      const result = getAllDescendantIds(parent);
      expect(result).toEqual([2, 3]);
    });

    it('returns nested descendant ids', () => {
      const grandchild = makeProduct(3);
      const child = makeProduct(2, { children: [grandchild] });
      const parent = makeProduct(1, { children: [child] });
      const result = getAllDescendantIds(parent);
      expect(result).toEqual([3]);
    });
  });

  describe('findRootProduct', () => {
    it('returns self if no parent', () => {
      const product = makeProduct(1);
      const result = findRootProduct(product);
      expect(result.id).toBe(1);
    });

    it('returns root parent', () => {
      const root = makeProduct(1);
      const child = makeProduct(2, { parent: root });
      const grandchild = makeProduct(3, { parent: child });
      const result = findRootProduct(grandchild);
      expect(result.id).toBe(1);
    });
  });

  describe('isDescendantOf', () => {
    it('returns false for unrelated products', () => {
      const product1 = makeProduct(1);
      const product2 = makeProduct(2);
      const result = isDescendantOf(product1, product2);
      expect(result).toBe(false);
    });

    it('returns true for direct child', () => {
      const child = makeProduct(2);
      const parent = makeProduct(1, { children: [child] });
      const result = isDescendantOf(child, parent);
      expect(result).toBe(true);
    });

    it('returns true for nested descendant', () => {
      const grandchild = makeProduct(3);
      const child = makeProduct(2, { children: [grandchild] });
      const parent = makeProduct(1, { children: [child] });
      const result = isDescendantOf(grandchild, parent);
      expect(result).toBe(true);
    });
  });
});
