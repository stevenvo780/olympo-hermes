import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/utils/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://test.com'
  }
}));

vi.mock('@/utils/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  },
  firestore: {},
  storage: {},
}));

import axiosServer from '@/utils/axiosServer';
import ProductsPage from '../page';
import React from 'react';

// Mock dependencies
vi.mock('@/utils/axiosServer');
vi.mock('./products/ProductsMain', () => ({
  default: function ProductsMain(props: Record<string, unknown>) {
    return <div data-testid="products-main" data-props={JSON.stringify(props)} />;
  }
}));
vi.mock('./components/ProductSchema', () => ({
  default: () => <div data-testid="product-schema" />
}));

describe('ProductsPage', () => {
  const storeId = 'test-store';
  const mockParams = Promise.resolve({ storeId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with empty data', async () => {
    vi.mocked(axiosServer.get).mockResolvedValue({ data: [] });

    // Since ProductsPage is an async Server Component, we call it directly
    await ProductsPage({ params: mockParams });

    // We can't easily render Server Components in jsdom without a framework wrapper
    // but we can check the result structure if we were checking JSX.
    // However, since we mock the children, checking if it executes without error
    // and calls axios is a good start as unit test.

    expect(axiosServer.get).toHaveBeenCalledTimes(3);
    // 1. /categories/test-store
    // 2. /categories/test-store/hierarchical
    // 3. /categories/test-store/get/roots
  });

  it('renders correctly with root categories and products', async () => {
    // Mock category responses
    const categories = [{ id: 1, name: 'Root cat' }];
    vi.mocked(axiosServer.get).mockImplementation((url: string) => {
      if (url.includes('/get/roots')) return Promise.resolve({ data: categories });
      if (url.includes('/products/')) return Promise.resolve({
        data: { products: [{ id: 100, name: 'Prod 1' }], total: 1 }
      });
      return Promise.resolve({ data: [] });
    });

    await ProductsPage({ params: mockParams });

    expect(axiosServer.get).toHaveBeenCalledWith(expect.stringContaining('/products/test-store'), expect.any(Object));
  });

  it('returns empty if storeId is favicon.ico', async () => {
    const result = await ProductsPage({ params: Promise.resolve({ storeId: 'favicon.ico' }) });
    // Should return empty fragment or similar
    expect(result).toEqual(<></>);
  });
});
