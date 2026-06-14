import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomerService, type CustomerExcelRow } from '../customerService';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/utils/axios', () => ({
  default: apiMocks,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CustomerService', () => {
  it('loads customers for a store', async () => {
    const customers = [{ id: 'c1', storeId: 'store-1' }];
    apiMocks.get.mockResolvedValue({ data: customers });

    const result = await CustomerService.getStoreCustomers('store-1');

    expect(apiMocks.get).toHaveBeenCalledWith('/customer/store/store-1');
    expect(result).toEqual(customers);
  });

  it('loads customer stats for a store', async () => {
    const stats = {
      totalCustomers: 5,
      activeCustomers: 4,
      averageSpent: 150,
      totalRevenue: 600,
    };
    apiMocks.get.mockResolvedValue({ data: stats });

    const result = await CustomerService.getStoreCustomerStats('store-1');

    expect(apiMocks.get).toHaveBeenCalledWith('/customer/store/store-1/stats');
    expect(result).toEqual(stats);
  });

  it('loads a customer by id', async () => {
    const customer = { id: 'cust-1', storeId: 'store-1', loyaltyPoints: 0 };
    apiMocks.get.mockResolvedValue({ data: customer });

    const result = await CustomerService.getCustomerById('cust-1');

    expect(apiMocks.get).toHaveBeenCalledWith('/customer/cust-1');
    expect(result).toEqual(customer);
  });

  it('creates a customer', async () => {
    const payload = { name: 'Ana', storeId: 'store-1', email: 'ana@example.com' };
    apiMocks.post.mockResolvedValue({ data: { id: 'cust-2' } });

    const result = await CustomerService.createCustomer(payload);

    expect(apiMocks.post).toHaveBeenCalledWith('/customer', payload);
    expect(result).toEqual({ id: 'cust-2' });
  });

  it('updates a customer', async () => {
    const payload = { name: 'Ana Updated', isActive: true };
    apiMocks.patch.mockResolvedValue({ data: { id: 'cust-3' } });

    const result = await CustomerService.updateCustomer('cust-3', payload);

    expect(apiMocks.patch).toHaveBeenCalledWith('/customer/cust-3', payload);
    expect(result).toEqual({ id: 'cust-3' });
  });

  it('exports customers with inactive flag', async () => {
    apiMocks.get.mockResolvedValue({ data: [] });

    await CustomerService.exportCustomers('store-1', true);

    const [url] = apiMocks.get.mock.calls[0];
    expect(url).toBe('/customer/store/store-1/export?includeInactive=true');
  });

  it('exports customers to excel with date filters', async () => {
    const blob = { size: 10 };
    apiMocks.get.mockResolvedValue({ data: blob });

    const result = await CustomerService.exportCustomersToExcel(
      'store-1',
      '2024-01-01',
      '2024-01-31',
      500,
    );

    const [url, config] = apiMocks.get.mock.calls[0];
    expect(url).toContain('/customer/store/store-1/export/excel?');
    expect(url).toContain('limit=500');
    expect(url).toContain('startDate=2024-01-01');
    expect(url).toContain('endDate=2024-01-31');
    expect(config).toEqual({ responseType: 'blob' });
    expect(result).toEqual(blob);
  });

  it('imports customers from excel rows', async () => {
    const rows: CustomerExcelRow[] = [{ email: 'test@example.com', action: 'create' }];
    const response = { created: 1, updated: 0, deleted: 0, skipped: 0, failed: 0, results: [] };
    apiMocks.post.mockResolvedValue({ data: response });

    const result = await CustomerService.importCustomersFromExcel('store-1', rows);

    expect(apiMocks.post).toHaveBeenCalledWith('/customer/store/store-1/import', { rows });
    expect(result).toEqual(response);
  });

  it('deletes a customer', async () => {
    apiMocks.delete.mockResolvedValue({});

    await CustomerService.deleteCustomer('cust-1');

    expect(apiMocks.delete).toHaveBeenCalledWith('/customer/cust-1');
  });
});
