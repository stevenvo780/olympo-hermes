import { afterEach, describe, expect, it, vi } from 'vitest';

const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

describe('env', () => {
  afterEach(() => {
    vi.resetModules();
    if (originalApiUrl === undefined) {
      delete (process.env as any).NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it('throws when NEXT_PUBLIC_API_URL is missing', async () => {
    delete (process.env as any).NEXT_PUBLIC_API_URL;

    await expect(import('@/utils/env')).rejects.toThrow(
      'NEXT_PUBLIC_API_URL is not defined',
    );
  });

  it('exports env when NEXT_PUBLIC_API_URL is set', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost';

    const { env } = await import('@/utils/env');

    expect(env.NEXT_PUBLIC_API_URL).toBe('http://localhost');
  });
});
