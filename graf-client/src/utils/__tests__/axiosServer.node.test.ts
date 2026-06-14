/* @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('axios', () => ({
  default: {
    create: (...args: unknown[]) => {
      mockCreate(...args);
      return { instance: 'mock-instance' };
    }
  }
}));

describe('axiosServer (node)', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    vi.resetModules();
    process.env.API_URL = 'http://server-api.test';
    process.env.NEXT_PUBLIC_API_URL = 'http://client-api.test';
  });

  it('uses API_URL when window is undefined', async () => {
    const axiosServer = (await import('../axiosServer')).default;

    expect(axiosServer).toEqual({ instance: 'mock-instance' });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'http://server-api.test'
    }));
  });
});
