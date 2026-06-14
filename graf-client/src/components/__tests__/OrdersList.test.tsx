/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import OrdersList from '../OrdersList';

// Mock Dependencies
const dispatchMock = vi.fn();
const useSelectorMock = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
  useSelector: (selector: any) => useSelectorMock(selector),
}));

// Mock Actions
vi.mock('@/redux/orders', () => ({
  fetchOrdersStart: vi.fn(() => ({ type: 'orders/start' })),
  fetchOrdersSuccess: vi.fn((payload) => ({ type: 'orders/success', payload })),
  fetchOrdersFailure: vi.fn((err) => ({ type: 'orders/failure', payload: err })),
}));
import { fetchOrdersStart, fetchOrdersSuccess, fetchOrdersFailure } from '@/redux/orders';

// Mock Axios
vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));
import api from '@/utils/axios';

// Mock Bootstrap
vi.mock('react-bootstrap', () => {
  return {
    Table: ({ children }: any) => <table>{children}</table>,
    Button: ({ children, onClick, disabled }: any) => <button onClick={onClick} disabled={disabled}>{children}</button>,
    Container: ({ children }: any) => <div>{children}</div>,
    Spinner: () => <div>Loading...</div>
  };
});

let container: HTMLDivElement;
let root: Root;

const renderComponent = async (storeId?: string) => {
  await act(async () => {
    root.render(<OrdersList storeId={storeId} />);
  });
};

describe('OrdersList', () => {
  const mockOrders = [
    { id: 'o1', store: { name: 'Store 1' }, status: 'paid', amount: { total: 100 }, createdAt: '2023-01-01' },
    { id: 'o2', store: null, status: 'pending', amount: { total: 200 }, createdAt: '2023-01-02' }
  ];

  const mockState = {
    orders: {
      orders: mockOrders,
      totalOrders: 20,
      loading: false
    }
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    dispatchMock.mockReset();
    useSelectorMock.mockImplementation((selector) => selector(mockState));
    (api.get as any).mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('fetches orders on mount', async () => {
    (api.get as any).mockResolvedValue({ data: mockOrders });

    await renderComponent();

    expect(dispatchMock).toHaveBeenCalledWith(fetchOrdersStart());
    expect(api.get).toHaveBeenCalledWith('/orders/my', { params: { limit: 10, offset: 0 } });
    expect(dispatchMock).toHaveBeenCalledWith(fetchOrdersSuccess({ orders: mockOrders, total: 2 }));
  });

  it('renders loading state', async () => {
    useSelectorMock.mockImplementation(selector => selector({
      orders: { orders: [], totalOrders: 0, loading: true }
    }));
    (api.get as any).mockResolvedValue({ data: [] });

    await renderComponent();
    expect(container.textContent).toContain('Loading...');
  });

  it('renders orders when loaded', async () => {
    (api.get as any).mockResolvedValue({ data: [] }); // api call happens but we rely on selector for rendering

    await renderComponent();

    expect(container.textContent).toContain('o1');
    expect(container.textContent).toContain('Store 1');
    expect(container.textContent).toContain('100');
    expect(container.textContent).toContain('o2');
    expect(container.textContent).toContain('Sin tienda');
  });

  it('renders empty state', async () => {
    useSelectorMock.mockImplementation(selector => selector({
      orders: { orders: [], totalOrders: 0, loading: false }
    }));
    (api.get as any).mockResolvedValue({ data: [] });

    await renderComponent();
    expect(container.textContent).toContain('No se encontraron órdenes');
  });

  it('handles pagination', async () => {
    (api.get as any).mockResolvedValue({ data: mockOrders });
    await renderComponent();

    expect(api.get).toHaveBeenCalledTimes(1);

    const buttons = container.querySelectorAll('button');
    const nextBtn = Array.from(buttons).find(b => b.textContent === 'Siguiente');

    expect(nextBtn).toBeTruthy();

    await act(async () => {
      nextBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(api.get).toHaveBeenCalledWith('/orders/my', { params: { limit: 10, offset: 10 } });

    // Test Previous Button
    const prevBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Anterior');
    await act(async () => {
      prevBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(api.get).toHaveBeenCalledWith('/orders/my', { params: { limit: 10, offset: 0 } });
  });

  it('handles fetch error', async () => {
    (api.get as any).mockRejectedValue(new Error('Network Error'));

    await renderComponent();

    expect(dispatchMock).toHaveBeenCalledWith(fetchOrdersFailure('Network Error'));
  });

  it('handles unknown fetch error', async () => {
    (api.get as any).mockRejectedValue('String Error');

    await renderComponent();

    expect(dispatchMock).toHaveBeenCalledWith(fetchOrdersFailure('Error desconocido'));
  });
});
