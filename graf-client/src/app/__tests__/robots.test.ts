// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import robots from '../robots';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('robots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test.com';
  });

  it('generates robots.txt with stores', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'store1' }, { id: 'store2' }]),
    });

    const result = await robots();

    expect(result.rules).toHaveLength(3);
    expect(result.sitemap).toBe('https://test.com/sitemap.xml');
    expect(result.host).toBe('https://test.com');

    // Check that store routes are included
    const firstRule = result.rules[0];
    expect(firstRule.allow).toContain('/store1');
    expect(firstRule.allow).toContain('/store2');
    expect(firstRule.disallow).toContain('/store1/login');
    expect(firstRule.disallow).toContain('/store2/checkout');
  });

  it('generates robots.txt when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await robots();

    expect(result.rules).toBeDefined();
    expect(result.sitemap).toBe('https://test.com/sitemap.xml');
  });

  it('generates robots.txt when API returns error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await robots();

    expect(result.rules).toBeDefined();
    expect(result.sitemap).toBe('https://test.com/sitemap.xml');
  });

  it('uses default URL when env not set', async () => {
    delete (process.env as any).NEXT_PUBLIC_SITE_URL;
    delete (process.env as any).NEXT_PUBLIC_API_URL;
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await robots();

    expect(result.sitemap).toBe('https://graf.com.co/sitemap.xml');
    expect(result.host).toBe('https://graf.com.co');
  });

  it('includes bot-specific rules', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await robots();

    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const googlebotRule = rules.find(r => r.userAgent === 'Googlebot');
    const bingbotRule = rules.find(r => r.userAgent === 'Bingbot');

    expect(googlebotRule).toBeDefined();
    expect(googlebotRule?.allow).toContain('/*.js');
    expect(bingbotRule).toBeDefined();
    expect(bingbotRule?.disallow).toContain('/search');
  });
});
