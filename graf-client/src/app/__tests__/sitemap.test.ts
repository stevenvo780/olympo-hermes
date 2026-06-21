// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import sitemap from '../sitemap';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test.com';
  });

  it('generates sitemap with stores', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'store1' }, { id: 'store2' }]),
    });

    const result = await sitemap();

    // Check static routes
    const homeRoute = result.find(r => r.url === 'https://test.com/');
    expect(homeRoute).toBeDefined();
    expect(homeRoute?.priority).toBe(1.0);

    // Check store routes
    const store1Route = result.find(r => r.url === 'https://test.com/store1');
    expect(store1Route).toBeDefined();
  });

  it('generates sitemap when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await sitemap();

    // Should still have static routes
    expect(result.length).toBeGreaterThan(0);
    const homeRoute = result.find(r => r.url.endsWith('/'));
    expect(homeRoute).toBeDefined();
  });

  it('generates sitemap when API returns error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await sitemap();

    // Should still have static routes
    expect(result.length).toBeGreaterThan(0);
  });

  it('uses default URL when env not set', async () => {
    delete (process.env as any).NEXT_PUBLIC_SITE_URL;
    delete (process.env as any).NEXT_PUBLIC_API_URL;
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await sitemap();

    const homeRoute = result.find(r => r.url === 'https://hermes.com.co/');
    expect(homeRoute).toBeDefined();
  });

  it('sets appropriate change frequencies', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await sitemap();

    const homeRoute = result.find(r => r.url.endsWith('/'));
    expect(homeRoute?.changeFrequency).toBe('daily');
  });

  it('includes all static paths', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await sitemap();
    const urls = result.map(r => r.url);

    expect(urls.some(u => u.includes('/hermes'))).toBe(true);
    expect(urls.some(u => u.includes('/hermes/home'))).toBe(true);
    expect(urls.some(u => u.includes('/hermes/privacyPolicies'))).toBe(true);
  });

  it('creates routes for store subpaths', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'mystore' }]),
    });

    const result = await sitemap();
    const urls = result.map(r => r.url);

    expect(urls.some(u => u.includes('/mystore'))).toBe(true);
    expect(urls.some(u => u.includes('/mystore/about'))).toBe(true);
    expect(urls.some(u => u.includes('/mystore/checkout'))).toBe(true);
  });
});
