import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

const restoreEnv = () => {
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  Object.assign(process.env, originalEnv);
};

afterEach(() => {
  restoreEnv();
  vi.resetModules();
});

describe('env', () => {
  it('exposes NEXT_PUBLIC_API_URL when defined', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.test';
    const { env } = await import('../env');

    expect(env.NEXT_PUBLIC_API_URL).toBe('http://api.test');
  });

  it('throws when NEXT_PUBLIC_API_URL is missing', async () => {
    delete (process.env as any).NEXT_PUBLIC_API_URL;

    await expect(import('../env')).rejects.toThrow('NEXT_PUBLIC_API_URL is not defined');
  });
});
