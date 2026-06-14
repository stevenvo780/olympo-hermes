/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { calculateCartTotals, CartItem } from '../cartUtils';
import { Product, DeliveryZone } from '@/types';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Test Product',
  basePrice: 100,
  discountPrice: 0,
  taxPrice: 0,
  totalPrice: 100,
  description: 'Test description',
  isActive: true,
  isAvailable: true,
  ...overrides,
} as Product);

describe('cartUtils', () => {
  describe('calculateCartTotals', () => {
    it('returns zeros for empty cart', () => {
      const result = calculateCartTotals([]);
      expect(result).toEqual({
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        total: 0,
        items: 0,
      });
    });

    it('returns zeros when called without arguments', () => {
      const result = calculateCartTotals();
      expect(result.total).toBe(0);
    });

    it('calculates totals for single item', () => {
      const items: CartItem[] = [
        { product: makeProduct(), quantity: 2, finalPrice: 100 },
      ];
      const result = calculateCartTotals(items);
      expect(result.subtotal).toBe(200);
      expect(result.items).toBe(2);
    });

    it('calculates totals for multiple items', () => {
      const items: CartItem[] = [
        { product: makeProduct({ basePrice: 50, totalPrice: 50 }), quantity: 2, finalPrice: 50 },
        { product: makeProduct({ basePrice: 100, totalPrice: 100 }), quantity: 1, finalPrice: 100 },
      ];
      const result = calculateCartTotals(items);
      expect(result.subtotal).toBe(200);
      expect(result.total).toBe(200);
      expect(result.items).toBe(3);
    });

    it('includes discounts in calculation', () => {
      const items: CartItem[] = [
        { product: makeProduct({ discountPrice: 10 }), quantity: 2, finalPrice: 90 },
      ];
      const result = calculateCartTotals(items);
      expect(result.discountTotal).toBe(20);
    });

    it('includes taxes in calculation', () => {
      const items: CartItem[] = [
        { product: makeProduct({ taxPrice: 5 }), quantity: 2, finalPrice: 105 },
      ];
      const result = calculateCartTotals(items);
      expect(result.taxTotal).toBe(10);
    });

    it('adds delivery zone price', () => {
      const items: CartItem[] = [
        { product: makeProduct(), quantity: 1, finalPrice: 100 },
      ];
      const zone = { id: 1, name: 'Zone1', price: 50 } as unknown as DeliveryZone;
      const result = calculateCartTotals(items, zone);
      expect(result.total).toBe(150);
    });

    it('applies free shipping when subtotal meets threshold', () => {
      const items: CartItem[] = [
        { product: makeProduct({ basePrice: 200, totalPrice: 200 }), quantity: 1, finalPrice: 200 },
      ];
      const zone = {
        id: 1,
        name: 'Zone1',
        price: 50,
        freeShippingThreshold: 100,
      } as unknown as DeliveryZone;
      const result = calculateCartTotals(items, zone);
      expect(result.total).toBe(200);
    });

    it('charges delivery when subtotal below threshold', () => {
      const items: CartItem[] = [
        { product: makeProduct({ basePrice: 50, totalPrice: 50 }), quantity: 1, finalPrice: 50 },
      ];
      const zone = {
        id: 1,
        name: 'Zone1',
        price: 20,
        freeShippingThreshold: 100,
      } as unknown as DeliveryZone;
      const result = calculateCartTotals(items, zone);
      expect(result.total).toBe(70);
    });

    it('handles null delivery zone', () => {
      const items: CartItem[] = [
        { product: makeProduct(), quantity: 1, finalPrice: 100 },
      ];
      const result = calculateCartTotals(items, null);
      expect(result.total).toBe(100);
    });
  });
});
