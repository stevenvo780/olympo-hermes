import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrderService } from '../orderService';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/utils/axios', () => ({
  default: apiMocks,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OrderService', () => {
  it('validates orders', async () => {
    const payload = { items: [], store: { id: 'store-1' } };
    const response = { total: 100 };
    apiMocks.post.mockResolvedValue({ data: response });

    const result = await OrderService.validateOrder(payload);

    expect(apiMocks.post).toHaveBeenCalledWith('/orders/validate', payload);
    expect(result).toEqual(response);
  });

  it('creates orders with store id', async () => {
    const response = { id: 'order-1' };
    apiMocks.post.mockResolvedValue({ data: response });

    const result = await OrderService.createOrder('store-1', {
      items: [],
      customAnswers: [],
      notes: 'note',
    });

    expect(apiMocks.post).toHaveBeenCalledWith('/orders', {
      items: [],
      customAnswers: [],
      notes: 'note',
      store: { id: 'store-1' },
    });
    expect(result).toEqual(response);
  });

  it('searches users with params', async () => {
    const response = { users: [], total: 0 };
    apiMocks.get.mockResolvedValue({ data: response });

    const result = await OrderService.searchUsers('alice', 5);

    expect(apiMocks.get).toHaveBeenCalledWith('/user', {
      params: {
        search: 'alice',
        limit: 5,
        offset: 0,
      },
    });
    expect(result).toEqual(response);
  });

  it('filters customers by query', async () => {
    const customers = [
      { name: 'Ana', email: 'ana@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Carlos', email: 'carlos@demo.com' },
    ];
    apiMocks.get.mockResolvedValue({ data: customers });

    const result = await OrderService.searchCustomers('store-1', 'an');

    expect(apiMocks.get).toHaveBeenCalledWith('/customer/store/store-1');
    expect(result).toEqual([customers[0]]);
  });

  it('filters customers by email when name is missing', async () => {
    const customers = [
      { name: '', email: 'ventas@example.com' },
      { name: 'Luis', email: 'luis@example.com' },
    ];
    apiMocks.get.mockResolvedValue({ data: customers });

    const result = await OrderService.searchCustomers('store-1', 'vent');

    expect(result).toEqual([customers[0]]);
  });

  it('handles customers without email when filtering', async () => {
    const customers = [
      { name: 'Ana', email: undefined },
      { name: 'Bob', email: 'bob@example.com' },
    ];
    apiMocks.get.mockResolvedValue({ data: customers });

    const result = await OrderService.searchCustomers('store-1', 'bob');

    expect(result).toEqual([customers[1]]);
  });

  it('returns all customers for short queries', async () => {
    const customers = [
      { name: 'Ana', email: 'ana@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ];
    apiMocks.get.mockResolvedValue({ data: customers });

    const result = await OrderService.searchCustomers('store-1', 'a');

    expect(result).toEqual(customers);
  });

  it('searches products with paging', async () => {
    const response = { products: [], total: 0, currentPage: 1, totalPages: 0 };
    apiMocks.get.mockResolvedValue({ data: response });

    const result = await OrderService.searchProducts('store-1', 'cola', 10, 20);

    expect(apiMocks.get).toHaveBeenCalledWith('/products/store-1', {
      params: {
        text: 'cola',
        limit: 10,
        offset: 20,
        exist: true,
      },
    });
    expect(result).toEqual(response);
  });

  it('loads delivery zones for a store', async () => {
    const zones = [{ id: 1, name: 'Centro' }];
    apiMocks.get.mockResolvedValue({ data: zones });

    const result = await OrderService.getDeliveryZones('store-1');

    expect(apiMocks.get).toHaveBeenCalledWith('/delivery-zones/store-1');
    expect(result).toEqual(zones);
  });

  it('loads taxes for a store', async () => {
    const taxes = [{ id: 1, name: 'IVA' }];
    apiMocks.get.mockResolvedValue({ data: taxes });

    const result = await OrderService.getTaxes('store-1');

    expect(apiMocks.get).toHaveBeenCalledWith('/taxes/store-1');
    expect(result).toEqual(taxes);
  });

  it('creates customers in the order flow', async () => {
    const payload = { name: 'Ana', email: 'ana@example.com', storeId: 'store-1' };
    apiMocks.post.mockResolvedValue({ data: { id: 'cust-1' } });

    const result = await OrderService.createCustomer('store-1', payload);

    expect(apiMocks.post).toHaveBeenCalledWith('/customer', payload);
    expect(result).toEqual({ id: 'cust-1' });
  });
});
