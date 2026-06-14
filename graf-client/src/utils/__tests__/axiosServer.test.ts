/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: (...args: unknown[]) => {
      mockCreate(...args);
      return { instance: 'mock-instance' };
    }
  }
}));

import axiosServer from '../axiosServer';

describe('axiosServer', () => {
  it('creates an axios instance with correct config', () => {
    expect(axiosServer).toEqual({ instance: 'mock-instance' });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }));
  });
});
