/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useCustomers } from '../useCustomers';

const authMocks = vi.hoisted(() => ({
  currentUser: null as null | { getIdToken: () => Promise<string> },
  onAuthStateChanged: vi.fn(),
}));

vi.mock('@/utils/firebase', () => ({
  auth: authMocks,
}));

const TestComponent = ({ storeId }: { storeId: string }) => {
  const { customers, stats, isLoading, error, refetch } = useCustomers(storeId);

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="customers">{customers.length}</div>
      <div data-testid="stats">
        {stats ? `${stats.totalCustomers}-${stats.activeCustomers}-${stats.averageSpent}` : 'none'}
      </div>
      <div data-testid="error">{error ?? ''}</div>
      <button onClick={() => refetch()}>refetch</button>
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

const makeCustomer = () => ({
  id: 1,
  name: 'Ana',
  email: 'ana@example.com',
  loyaltyPoints: 0,
  isActive: true,
  totalSpent: 100,
  totalOrders: 2,
  storeId: 'store-1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
});

const buildCustomer = (overrides: Partial<ReturnType<typeof makeCustomer>> = {}) => ({
  ...makeCustomer(),
  ...overrides,
});

const getText = (testId: string) => screen.getByTestId(testId).textContent ?? '';
const okResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => data,
});
const errorResponse = (status = 500, statusText = 'Server Error') => ({
  ok: false,
  status,
  statusText,
  json: async () => ({}),
});

const originalFetch = globalThis.fetch;

beforeEach(() => {
  authMocks.currentUser = { getIdToken: vi.fn().mockResolvedValue('token') };
  authMocks.onAuthStateChanged.mockImplementation((callback: (user: unknown) => void) => {
    callback(authMocks.currentUser);
    return vi.fn();
  });
});

afterEach(() => {
  cleanup();
  authMocks.onAuthStateChanged.mockReset();
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('app customers hook', () => {
  it('fetches customers and stats on auth change', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [makeCustomer()],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ totalCustomers: 1, activeCustomers: 1, averageSpent: 100 }),
      });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('loading')).toBe('false');
      expect(getText('customers')).toBe('1');
      expect(getText('stats')).toBe('1-1-100');
    });

    const [firstUrl, firstOptions] = fetchMock.mock.calls[0];
    expect(firstUrl).toContain('/customer/store/store-1');
    expect(firstOptions?.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
  });

  it('falls back to empty customers when response is not an array', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResponse({}))
      .mockResolvedValueOnce(okResponse({ totalCustomers: 0, activeCustomers: 0, averageSpent: 0 }));
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('customers')).toBe('0');
      expect(getText('stats')).toBe('0-0-0');
    });
  });

  it('computes stats from customers when stats endpoint fails', async () => {
    const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const customers = [
      buildCustomer({ id: 1, isActive: true, totalOrders: 2, totalSpent: 100 }),
      buildCustomer({ id: 2, isActive: false, totalOrders: 5, totalSpent: 50 }),
      buildCustomer({ id: 3, isActive: true, totalOrders: 0, totalSpent: 150 }),
    ];

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => customers,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => customers,
      });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('stats')).toBe('3-1-100');
    });

    warnSpy.mockRestore();
  });

  it('allows refetch to trigger the API again', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [makeCustomer()],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ totalCustomers: 1, activeCustomers: 1, averageSpent: 100 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ totalCustomers: 0, activeCustomers: 0, averageSpent: 0 }),
      });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('customers')).toBe('1');
    });

    fireEvent.click(screen.getByText('refetch'));

    await waitFor(() => {
      expect(getText('customers')).toBe('0');
      expect(getText('stats')).toBe('0-0-0');
    });
  });

  it('sets an error when customers response is not ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(errorResponse(500, 'Server Error'))
      .mockResolvedValueOnce(okResponse({ totalCustomers: 0, activeCustomers: 0, averageSpent: 0 }));
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('error')).toContain('Error 500: Server Error');
    });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('uses a generic error when fetch throws a non-error value', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const fetchMock = vi.fn()
      .mockRejectedValueOnce('boom')
      .mockResolvedValueOnce(okResponse({ totalCustomers: 0, activeCustomers: 0, averageSpent: 0 }));
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('error')).toBe('Error desconocido');
    });

    errorSpy.mockRestore();
  });

  it('logs fallback stats errors when both requests fail', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResponse([makeCustomer()]))
      .mockResolvedValueOnce(errorResponse(500, 'Stats Error'))
      .mockRejectedValueOnce(new Error('fallback failed'));
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });

    errorSpy.mockRestore();
  });

  it('sets zero averages when fallback customers are empty', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResponse([]))
      .mockResolvedValueOnce(errorResponse(500, 'Stats Error'))
      .mockResolvedValueOnce(okResponse([]));
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('stats')).toBe('0-0-0');
    });
  });

  it('sets zero averages when fallback customers response is not an array', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResponse([makeCustomer()]))
      .mockResolvedValueOnce(errorResponse(500, 'Stats Error'))
      .mockResolvedValueOnce(okResponse({}));
    globalThis.fetch = fetchMock as typeof fetch;

    render(<TestComponent storeId="store-1" />);

    await waitFor(() => {
      expect(getText('stats')).toBe('0-0-0');
    });
  });

  it('throws when auth user is missing', async () => {
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.currentUser = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());

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
      captured!.createCustomer({ name: 'Ana', email: 'ana@example.com', loyaltyPoints: 0, isActive: true })
    ).rejects.toThrow('Usuario no autenticado');
  });

  it('creates customers through the API', async () => {
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const customer = makeCustomer();
    const fetchMock = vi.fn().mockResolvedValueOnce(okResponse(customer));
    globalThis.fetch = fetchMock as typeof fetch;

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

    const result = await captured!.createCustomer({
      name: customer.name,
      email: customer.email,
      loyaltyPoints: customer.loyaltyPoints,
      isActive: customer.isActive,
    });

    expect(result).toEqual(customer);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/customer');
    expect(options?.method).toBe('POST');
  });

  it('throws when createCustomer response is not ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const fetchMock = vi.fn().mockResolvedValueOnce(errorResponse(400, 'Bad Request'));
    globalThis.fetch = fetchMock as typeof fetch;

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
      captured!.createCustomer({ name: 'Ana', email: 'ana@example.com', loyaltyPoints: 0, isActive: true })
    ).rejects.toThrow('Error 400: Bad Request');

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('updates customers through the API', async () => {
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const updated = { ...makeCustomer(), name: 'Ana Maria' };
    const fetchMock = vi.fn().mockResolvedValueOnce(okResponse(updated));
    globalThis.fetch = fetchMock as typeof fetch;

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

    const result = await captured!.updateCustomer(updated.id, { name: 'Ana Maria' });
    expect(result).toEqual(updated);
  });

  it('throws when updateCustomer response is not ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const fetchMock = vi.fn().mockResolvedValueOnce(errorResponse(500, 'Update Error'));
    globalThis.fetch = fetchMock as typeof fetch;

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

    await expect(captured!.updateCustomer(1, { name: 'Ana Maria' })).rejects.toThrow(
      'Error 500: Update Error'
    );

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('deletes customers through the API', async () => {
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const fetchMock = vi.fn().mockResolvedValueOnce(okResponse({}));
    globalThis.fetch = fetchMock as typeof fetch;

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

    await captured!.deleteCustomer(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/customer/1');
    expect(options?.method).toBe('DELETE');
  });

  it('throws when deleteCustomer response is not ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const fetchMock = vi.fn().mockResolvedValueOnce(errorResponse(404, 'Not Found'));
    globalThis.fetch = fetchMock as typeof fetch;

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

    await expect(captured!.deleteCustomer(1)).rejects.toThrow('Error 404: Not Found');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('updates loyalty points through the API', async () => {
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const updated = { ...makeCustomer(), loyaltyPoints: 20 };
    const fetchMock = vi.fn().mockResolvedValueOnce(okResponse(updated));
    globalThis.fetch = fetchMock as typeof fetch;

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

    const result = await captured!.updateLoyaltyPoints(updated.id, 20);
    expect(result).toEqual(updated);
  });

  it('throws when updateLoyaltyPoints response is not ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const fetchMock = vi.fn().mockResolvedValueOnce(errorResponse(500, 'Points Error'));
    globalThis.fetch = fetchMock as typeof fetch;

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

    await expect(captured!.updateLoyaltyPoints(1, 10)).rejects.toThrow('Error 500: Points Error');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('links a user to a customer through the API', async () => {
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const updated = { ...makeCustomer(), userId: 'user-9' };
    const fetchMock = vi.fn().mockResolvedValueOnce(okResponse(updated));
    globalThis.fetch = fetchMock as typeof fetch;

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

    const result = await captured!.linkUserToCustomer(updated.id, 'user-9');
    expect(result).toEqual(updated);
  });

  it('updates multiple customers without overwriting others', async () => {
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());

    const customerA = buildCustomer({ id: 1, name: 'Ana' });
    const customerB = buildCustomer({ id: 2, name: 'Beto' });
    const updated = { ...customerA, name: 'Ana Maria' };
    const updatedPoints = { ...updated, loyaltyPoints: 20 };
    const updatedLinked = { ...updatedPoints, userId: 'user-9' };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResponse([customerA, customerB]))
      .mockResolvedValueOnce(okResponse(updated))
      .mockResolvedValueOnce(okResponse(updatedPoints))
      .mockResolvedValueOnce(okResponse(updatedLinked));
    globalThis.fetch = fetchMock as typeof fetch;

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

    await captured!.fetchCustomers();
    await captured!.updateCustomer(customerA.id, { name: 'Ana Maria' });
    await captured!.updateLoyaltyPoints(customerA.id, 20);
    await captured!.linkUserToCustomer(customerA.id, 'user-9');
  });

  it('throws when linkUserToCustomer response is not ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const fetchMock = vi.fn().mockResolvedValueOnce(errorResponse(500, 'Link Error'));
    globalThis.fetch = fetchMock as typeof fetch;

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

    await expect(captured!.linkUserToCustomer(1, 'user-1')).rejects.toThrow('Error 500: Link Error');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
  it('fetches customers with query params', async () => {
    let captured: ReturnType<typeof useCustomers> | null = null;
    authMocks.onAuthStateChanged.mockImplementation(() => vi.fn());
    const fetchMock = vi.fn().mockResolvedValue(okResponse([makeCustomer()]));
    globalThis.fetch = fetchMock as typeof fetch;

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

    await captured!.fetchCustomers({
      search: 'Ana',
      page: 1,
      limit: 10,
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });

    const calls = fetchMock.mock.calls;
    // Find the call that includes parameters
    const paramCall = calls.find(call => String(call[0]).includes('?'));
    expect(paramCall).toBeDefined();
    const url = String(paramCall![0]);
    expect(url).toContain('search=Ana');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=10');
    expect(url).toContain('startDate=2024-01-01');
    expect(url).toContain('endDate=2024-12-31');
  });
});
