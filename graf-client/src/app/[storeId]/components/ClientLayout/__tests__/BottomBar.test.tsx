/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import BottomBar from '../BottomBar';

// Mock Dependencies
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('@/services/orderService', () => ({
  createOrderAndPayWithWompi: vi.fn()
}));

vi.mock('@/utils/formatters', () => ({
  formatNumberWithCommas: (n: number) => String(n)
}));

import { useSelector, useDispatch } from 'react-redux';

describe('BottomBar', () => {
  let container: HTMLDivElement;
  let root: Root;
  const mockDispatch = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
    (useDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
  });

  it('renders nothing if storeId is missing', async () => {
    await act(async () => {
      root.render(<BottomBar storeId="" isProductsPage={true} handleOpenFilters={vi.fn()} handleWhatsAppClick={vi.fn()} />);
    });
    expect(container.innerHTML).toBe('');
  });

  it('renders generic floating buttons', async () => {
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: Record<string, unknown>) => unknown) => selector({
      ui: { store: null },
      cart: { carts: {} }
    }));

    await act(async () => {
      root.render(<BottomBar storeId="1" isProductsPage={false} handleOpenFilters={vi.fn()} handleWhatsAppClick={vi.fn()} />);
    });
    // Should show whatsapp button at least
    expect(container.querySelector('[title="Chat de WhatsApp"]')).toBeDefined();
  });

  it('shows cart button when items exist', async () => {
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: Record<string, unknown>) => unknown) => selector({
      ui: { store: null },
      cart: { carts: { '1': { items: [{ product: { id: 1 }, quantity: 1, finalPrice: 100 }] } } }
    }));

    await act(async () => {
      root.render(<BottomBar storeId="1" isProductsPage={true} handleOpenFilters={vi.fn()} handleWhatsAppClick={vi.fn()} />);
    });

    const cartBtn = container.querySelector('[title="Ver carrito"]');
    expect(cartBtn).not.toBeNull();
    expect(cartBtn?.textContent).toContain('1'); // qty
  });
});
