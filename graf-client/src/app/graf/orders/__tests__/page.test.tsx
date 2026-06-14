/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import MyOrdersPage, { dynamic } from '../page';

// Mock Child Component
vi.mock('@/components/OrdersList', () => ({
  default: ({ storeId }: { storeId: string }) => <div data-testid="orders-list" data-store-id={storeId} />
}));

let container: HTMLDivElement;
let root: Root;

describe('MyOrdersPage', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders OrdersList with empty storeId', async () => {
    await act(async () => {
      root.render(<MyOrdersPage />);
    });
    const ordersList = container.querySelector('[data-testid="orders-list"]');
    expect(ordersList).toBeTruthy();
    expect(ordersList?.getAttribute('data-store-id')).toBe('');
  });

  it('is forced dynamic', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
