/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import OrdersPage from '../page';

// Mock Child Component (OrdersList)
vi.mock('@/components/OrdersList', () => {
  const MockOrdersList = (props: { storeId: string }) => <div data-testid="orders-list" data-store-id={props.storeId} />;
  MockOrdersList.displayName = 'MockOrdersList';
  return { default: MockOrdersList };
});

interface PageProps {
  params: Promise<{ storeId?: string }>;
}

interface JSXElement {
  props: {
    storeId: string;
  };
}

describe('OrdersPage', () => {
  it('renders OrdersList with storeId', async () => {
    const params = Promise.resolve({ storeId: '123' });
    const result = await OrdersPage({ params } as PageProps);

    expect(result).toBeDefined();
    // Since it's a server component returning JSX
    expect((result as JSXElement).props.storeId).toBe('123');
  });

  it('handles missing storeId', async () => {
    const params = Promise.resolve({});
    const result = await OrdersPage({ params } as PageProps);
    expect((result as JSXElement).props.storeId).toBe('');
  });
});
