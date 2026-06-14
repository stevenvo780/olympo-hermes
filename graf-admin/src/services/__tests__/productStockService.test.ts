import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductStockService } from '../productStockService';

const apiMocks = vi.hoisted(() => ({
  patch: vi.fn(),
}));

vi.mock('@/utils/axios', () => ({
  default: apiMocks,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProductStockService', () => {
  it('updates stock with defaults', async () => {
    apiMocks.patch.mockResolvedValue({ data: { productId: 1 } });

    const result = await ProductStockService.updateStock(1, 'store-1', 5);

    expect(apiMocks.patch).toHaveBeenCalledWith('/products/store-1/stock/1', {
      stock: 5,
      source: 'admin-panel',
      reason: 'Manual stock update from admin panel',
      orderId: undefined,
      metadata: undefined,
    });
    expect(result).toEqual({ productId: 1 });
  });

  it('increments stock with custom options', async () => {
    apiMocks.patch.mockResolvedValue({ data: { productId: 2 } });

    const result = await ProductStockService.incrementStock(2, 'store-1', 3, {
      reason: 'return',
      orderId: 'order-9',
    });

    expect(apiMocks.patch).toHaveBeenCalledWith('/products/store-1/stock/2/increment', {
      quantity: 3,
      reason: 'return',
      devolucionId: 'order-9',
      metadata: undefined,
    });
    expect(result).toEqual({ productId: 2 });
  });

  it('increments stock with default reason', async () => {
    apiMocks.patch.mockResolvedValue({ data: { productId: 4 } });

    const result = await ProductStockService.incrementStock(4, 'store-1', 1);

    expect(apiMocks.patch).toHaveBeenCalledWith('/products/store-1/stock/4/increment', {
      quantity: 1,
      reason: 'Stock increment from admin panel',
      devolucionId: undefined,
      metadata: undefined,
    });
    expect(result).toEqual({ productId: 4 });
  });

  it('decrements stock with metadata', async () => {
    apiMocks.patch.mockResolvedValue({ data: { productId: 3 } });

    const result = await ProductStockService.decrementStock(3, 'store-1', 2, {
      source: 'pos',
      reason: 'sale',
      ventaId: 11,
      metadata: { reasonCode: 'manual' },
    });

    expect(apiMocks.patch).toHaveBeenCalledWith('/products/store-1/stock/3/decrement', {
      decrementBy: 2,
      source: 'pos',
      ventaId: 11,
      reason: 'sale',
      metadata: { reasonCode: 'manual' },
    });
    expect(result).toEqual({ productId: 3 });
  });

  it('decrements stock with default source and reason', async () => {
    apiMocks.patch.mockResolvedValue({ data: { productId: 5 } });

    const result = await ProductStockService.decrementStock(5, 'store-1', 2);

    expect(apiMocks.patch).toHaveBeenCalledWith('/products/store-1/stock/5/decrement', {
      decrementBy: 2,
      source: 'admin-panel',
      ventaId: undefined,
      reason: 'Stock decrement from admin panel',
      metadata: undefined,
    });
    expect(result).toEqual({ productId: 5 });
  });
});
