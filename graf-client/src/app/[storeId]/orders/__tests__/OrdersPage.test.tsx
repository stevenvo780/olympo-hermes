/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CommerceOrdersPage from '../page';

// Mock Component
vi.mock('@/components/OrdersList', () => ({
  default: ({ storeId }: any) => <div data-testid="orders-list">OrdersList: {storeId}</div>
}));

describe('CommerceOrdersPage', () => {
  it('renders OrdersList with correct storeId', async () => {
    const params = Promise.resolve({ storeId: 'test-store-999' });
    const jsx = await CommerceOrdersPage({ params });

    render(jsx);

    expect(screen.getByTestId('orders-list')).toBeTruthy();
    expect(screen.getByText('OrdersList: test-store-999')).toBeTruthy();
  });

  it('handles missing storeId gracefully', async () => {
    const params = Promise.resolve({});
    const jsx = await CommerceOrdersPage({ params });

    render(jsx);

    expect(screen.getByText('OrdersList:')).toBeTruthy();
  });
});
