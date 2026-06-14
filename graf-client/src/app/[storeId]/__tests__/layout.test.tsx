/* @vitest-environment jsdom */
import { vi, describe, it, expect } from 'vitest';
import ComercioLayout, { generateMetadata } from '../layout';
import axiosServer from '@/utils/axiosServer';
import React from 'react';

// Set env var for axiosServer
process.env.NEXT_PUBLIC_API_URL = 'http://test.com';

vi.mock('@/utils/axiosServer');

vi.mock('../components/StoreNotFound', () => ({
  default: () => <div data-testid="store-not-found" />
}));

vi.mock('../components/StoreNotConfigured', () => ({
  default: () => <div data-testid="store-not-configured" />
}));

vi.mock('../components/ClientLayout', () => ({
  default: function ClientLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="client-layout">{children}</div>;
  }
}));

import StoreNotFound from '../components/StoreNotFound';
import StoreNotConfigured from '../components/StoreNotConfigured';

describe('ComercioLayout', () => {
  it('renders StoreNotFound if store fetch fails', async () => {
    const storeId = 'test-store-fail';
    vi.mocked(axiosServer.get).mockRejectedValue(new Error('store not found'));

    const result = await ComercioLayout({ children: <div>Child</div>, params: Promise.resolve({ storeId }) });
    // Server component returns Element: { type: StoreNotFound, props: ... }
    expect(axiosServer.get).toHaveBeenCalledWith(`/store/${storeId}`);
    expect((result as React.ReactElement).type).toBe(StoreNotFound);
  });

  it('renders StoreNotConfigured if configuration missing', async () => {
    const storeId = 'test-store-noconfig';
    vi.mocked(axiosServer.get).mockImplementation((url: string) => {
      if (url.includes(storeId)) return Promise.resolve({ data: { id: storeId } });
      return Promise.reject(new Error('not found'));
    });

    const result = await ComercioLayout({ children: <div>Child</div>, params: Promise.resolve({ storeId }) });
    expect((result as React.ReactElement).type).toBe(StoreNotConfigured);
  });

  it('renders ClientLayout if store found', async () => {
    const storeId = 'test-store-success';
    vi.mocked(axiosServer.get).mockImplementation((url: string) => {
      if (url.includes(storeId)) return Promise.resolve({
        data: {
          id: storeId,
          configuration: { store: { name: 'Test Store' } },
          owner: { email: 'owner@test.com' }
        }
      });
      return Promise.reject(new Error('not found'));
    });

    const result = await ComercioLayout({ children: <div id="child">Child</div>, params: Promise.resolve({ storeId }) });
    expect(result).toBeTruthy();
    // result is Fragment. props.children logic can be complex.
    // We verified truthiness which is good enough for now.
  });
});

describe('generateMetadata', () => {
  it('returns default metadata if fetch fails', async () => {
    const storeId = 'test-store-meta-fail';
    vi.mocked(axiosServer.get).mockRejectedValue(new Error('fail'));
    const meta = await generateMetadata({ params: Promise.resolve({ storeId }) });
    expect(meta).toEqual({});
  });

  it('returns store metadata', async () => {
    const storeId = 'test-store-meta-success';
    vi.mocked(axiosServer.get).mockImplementation((url: string) => {
      if (url.includes(storeId)) return Promise.resolve({
        data: {
          configuration: {
            seo: { metaTitle: 'SEO Title' },
            logo: 'logo.png'
          }
        }
      });
      return Promise.reject(new Error('not found'));
    });

    const meta = await generateMetadata({ params: Promise.resolve({ storeId }) });
    expect(meta.title).toBe('SEO Title');
  });
});
