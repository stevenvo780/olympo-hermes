/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useCustomers } from '../useCustomers';

const serviceMocks = vi.hoisted(() => ({
  getStoreCustomers: vi.fn(),
  getStoreCustomerStats: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}));

vi.mock('@/services/customerService', () => ({
  CustomerService: serviceMocks,
}));

const TestComponent = ({ storeId }: { storeId: string }) => {
  const { customers, stats, isLoading, error, createCustomer } = useCustomers(storeId);

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="customers">{customers.length}</div>
      <div data-testid="stats">{stats ? stats.totalCustomers : 'none'}</div>
      <div data-testid="error">{error ?? ''}</div>
      <button onClick={() => createCustomer({ name: 'New Customer', storeId })}>create</button>
    </div>
  );
};

const HookHarness = ({
  storeId,
  onReady,
}: {
  storeId: string;
  onReady: (value: ReturnType<typeof useCustomers>) => void;
}) => {
  const value = useCustomers(storeId);

  React.useEffect(() => {
    onReady(value);
  }, [onReady, value]);

  return null;
};

const getText = (testId: string) => screen.getByTestId(testId).textContent ?? '';

const baseCustomer = {
  id: '1',
  name: 'Ana',
  storeId: 'store-1',
  loyaltyPoints: 0,
  isActive: true,
  totalSpent: 0,
  totalOrders: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

afterEach(() => {
  cleanup();
  serviceMocks.getStoreCustomers.mockReset();
  serviceMocks.getStoreCustomerStats.mockReset();
  serviceMocks.createCustomer.mockReset();
  serviceMocks.updateCustomer.mockReset();
  serviceMocks.deleteCustomer.mockReset();
});

describe('useCustomers', () => {
  it('does not fetch when storeId is empty', async () => {
    serviceMocks.getStoreCustomers.mockResolvedValue([]);

    render(<TestComponent storeId="" />);

    await waitFor(() => {
      expect(serviceMocks.getStoreCustomers).not.toHaveBeenCalled();
    });
  });

  it('loads customers and stats for the store', async () => {
    serviceMocks.getStoreCustomers.mockResolvedValue([baseCustomer]);
    serviceMocks.getStoreCustomerStats.mockResolvedValue({
      totalCustomers: 1,
      activeCustomers: 1,
      averageSpent: 0,
      totalRevenue: 0,
    });

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('loading')).toBe('false');
    });

    expect(serviceMocks.getStoreCustomers).toHaveBeenCalledWith('store-1');
    expect(serviceMocks.getStoreCustomerStats).toHaveBeenCalledWith('store-1');
    expect(getText('customers')).toBe('1');
    expect(getText('stats')).toBe('1');
  });

  it('keeps customers loaded if stats fail', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    serviceMocks.getStoreCustomers.mockResolvedValue([baseCustomer]);
    serviceMocks.getStoreCustomerStats.mockRejectedValue(new Error('stats failed'));

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('loading')).toBe('false');
    });

    expect(getText('customers')).toBe('1');
    expect(getText('stats')).toBe('none');
    warnSpy.mockRestore();
  });

  it('sets an error when customer fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    serviceMocks.getStoreCustomers.mockRejectedValue(new Error('boom'));

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('loading')).toBe('false');
    });

    expect(getText('error')).toBe('boom');
    errorSpy.mockRestore();
  });

  it('sets a generic error when the error is not an Error instance', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    serviceMocks.getStoreCustomers.mockRejectedValue('bad');

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('loading')).toBe('false');
    });

    expect(getText('error')).toBe('Error desconocido');
    errorSpy.mockRestore();
  });

  it('creates a customer and refetches the list', async () => {
    const secondCustomer = { ...baseCustomer, id: '2', name: 'Beto' };

    serviceMocks.getStoreCustomers
      .mockResolvedValueOnce([baseCustomer])
      .mockResolvedValueOnce([baseCustomer, secondCustomer]);
    serviceMocks.getStoreCustomerStats.mockResolvedValue({
      totalCustomers: 1,
      activeCustomers: 1,
      averageSpent: 0,
      totalRevenue: 0,
    });
    serviceMocks.createCustomer.mockResolvedValue(secondCustomer);

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('customers')).toBe('1');
    });

    fireEvent.click(screen.getByRole('button', { name: 'create' }));

    await waitFor(() => {
      expect(serviceMocks.createCustomer).toHaveBeenCalled();
      expect(serviceMocks.getStoreCustomers).toHaveBeenCalledTimes(2);
      expect(getText('customers')).toBe('2');
    });
  });

  it('bubbles errors when createCustomer fails', async () => {
    const error = new Error('create failed');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let captured: ReturnType<typeof useCustomers> | null = null;

    serviceMocks.getStoreCustomers.mockResolvedValue([]);
    serviceMocks.getStoreCustomerStats.mockResolvedValue({
      totalCustomers: 0,
      activeCustomers: 0,
      averageSpent: 0,
      totalRevenue: 0,
    });
    serviceMocks.createCustomer.mockRejectedValue(error);

    render(
      <HookHarness
        storeId="store-1"
        onReady={(value) => {
          captured = value;
        }}
      />
    );

    await waitFor(() => {
      expect(captured).not.toBeNull();
    });

    await expect(
      captured!.createCustomer({ name: 'Fail', storeId: 'store-1' })
    ).rejects.toBe(error);

    expect(errorSpy).toHaveBeenCalledWith('Error creating customer:', error);
    errorSpy.mockRestore();
  });

  it('updates customers and returns the updated data', async () => {
    const updatedCustomer = { ...baseCustomer, name: 'Ana Maria' };
    let captured: ReturnType<typeof useCustomers> | null = null;

    const secondCustomer = { ...baseCustomer, id: '2', name: 'Beto' };
    serviceMocks.getStoreCustomers.mockResolvedValue([baseCustomer, secondCustomer]);
    serviceMocks.getStoreCustomerStats.mockResolvedValue({
      totalCustomers: 1,
      activeCustomers: 1,
      averageSpent: 0,
      totalRevenue: 0,
    });
    serviceMocks.updateCustomer.mockResolvedValue(updatedCustomer);

    render(
      <HookHarness
        storeId="store-1"
        onReady={(value) => {
          captured = value;
        }}
      />
    );

    await waitFor(() => {
      expect(captured).not.toBeNull();
    });

    const result = await captured!.updateCustomer(baseCustomer.id, { name: 'Ana Maria' });
    expect(result).toEqual(updatedCustomer);
  });

  it('bubbles errors when updateCustomer fails', async () => {
    const error = new Error('update failed');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let captured: ReturnType<typeof useCustomers> | null = null;

    serviceMocks.getStoreCustomers.mockResolvedValue([baseCustomer]);
    serviceMocks.getStoreCustomerStats.mockResolvedValue({
      totalCustomers: 1,
      activeCustomers: 1,
      averageSpent: 0,
      totalRevenue: 0,
    });
    serviceMocks.updateCustomer.mockRejectedValue(error);

    render(
      <HookHarness
        storeId="store-1"
        onReady={(value) => {
          captured = value;
        }}
      />
    );

    await waitFor(() => {
      expect(captured).not.toBeNull();
    });

    await expect(
      captured!.updateCustomer(baseCustomer.id, { name: 'Ana Maria' })
    ).rejects.toBe(error);

    expect(errorSpy).toHaveBeenCalledWith('Error updating customer:', error);
    errorSpy.mockRestore();
  });

  it('deletes customers and refetches', async () => {
    let captured: ReturnType<typeof useCustomers> | null = null;

    serviceMocks.getStoreCustomers.mockResolvedValue([baseCustomer]);
    serviceMocks.getStoreCustomerStats.mockResolvedValue({
      totalCustomers: 1,
      activeCustomers: 1,
      averageSpent: 0,
      totalRevenue: 0,
    });
    serviceMocks.deleteCustomer.mockResolvedValue(undefined);

    render(
      <HookHarness
        storeId="store-1"
        onReady={(value) => {
          captured = value;
        }}
      />
    );

    await waitFor(() => {
      expect(captured).not.toBeNull();
    });

    await captured!.deleteCustomer(baseCustomer.id);
    expect(serviceMocks.deleteCustomer).toHaveBeenCalledWith(baseCustomer.id);
  });

  it('bubbles errors when deleteCustomer fails', async () => {
    const error = new Error('delete failed');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let captured: ReturnType<typeof useCustomers> | null = null;

    serviceMocks.getStoreCustomers.mockResolvedValue([baseCustomer]);
    serviceMocks.getStoreCustomerStats.mockResolvedValue({
      totalCustomers: 1,
      activeCustomers: 1,
      averageSpent: 0,
      totalRevenue: 0,
    });
    serviceMocks.deleteCustomer.mockRejectedValue(error);

    render(
      <HookHarness
        storeId="store-1"
        onReady={(value) => {
          captured = value;
        }}
      />
    );

    await waitFor(() => {
      expect(captured).not.toBeNull();
    });

    await expect(captured!.deleteCustomer(baseCustomer.id)).rejects.toBe(error);

    expect(errorSpy).toHaveBeenCalledWith('Error deleting customer:', error);
    errorSpy.mockRestore();
  });
});
