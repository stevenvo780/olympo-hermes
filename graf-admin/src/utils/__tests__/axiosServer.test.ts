import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };
const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
const originalWindow = (globalThis as { window?: Window }).window;

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
  if (hadWindow) {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
  vi.resetModules();
});

describe('axiosServer', () => {
  it('uses API_URL on the server', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    process.env.API_URL = 'http://api.server';
    process.env.NEXT_PUBLIC_API_URL = 'http://api.client';

    const { default: axiosServer } = await import('../axiosServer');
    expect(axiosServer.defaults.baseURL).toBe('http://api.server');
  });

  it('uses NEXT_PUBLIC_API_URL in the browser', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: {} as Window,
      writable: true,
      configurable: true,
    });
    process.env.API_URL = 'http://api.server';
    process.env.NEXT_PUBLIC_API_URL = 'http://api.client';

    const { default: axiosServer } = await import('../axiosServer');
    expect(axiosServer.defaults.baseURL).toBe('http://api.client');
  });
});
