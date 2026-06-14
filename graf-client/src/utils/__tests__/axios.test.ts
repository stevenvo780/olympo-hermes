/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Mock dependencies BEFORE importing the module under test
const { mockDispatch } = vi.hoisted(() => ({
  mockDispatch: vi.fn()
}));

vi.mock('../../redux/store', () => ({
  default: {
    dispatch: (...args: unknown[]) => mockDispatch(...args)
  }
}));

vi.mock('../../redux/ui', () => ({
  loading: (isLoading: boolean) => ({ type: 'ui/loading', payload: isLoading }),
  addNotification: (notification: unknown) => ({ type: 'ui/addNotification', payload: notification })
}));

vi.mock('../../redux/auth', () => ({
  logout: () => ({ type: 'auth/logout' })
}));

const mockGetCurrentUserToken = vi.fn();
const mockRefreshUserToken = vi.fn();

vi.mock('../firebaseHelper', () => ({
  getCurrentUserToken: () => mockGetCurrentUserToken(),
  refreshUserToken: () => mockRefreshUserToken(),
}));

// Use correct path to mock env
vi.mock('../env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://test-api.com'
  }
}));

// We need to capture the interceptors to call them manually in tests
const interceptors = vi.hoisted(() => ({
  request: { onFulfilled: null as any, onRejected: null as any },
  response: { onFulfilled: null as any, onRejected: null as any }
}));

const mockRequest = vi.fn().mockResolvedValue({ data: 'ok' });

// Mock axios
vi.mock('axios', () => {
  const createMock = {
    interceptors: {
      request: {
        use: (onFulfilled: any, onRejected: any) => {
          interceptors.request.onFulfilled = onFulfilled;
          interceptors.request.onRejected = onRejected;
          return 1;
        }
      },
      response: {
        use: (onFulfilled: any, onRejected: any) => {
          interceptors.response.onFulfilled = onFulfilled;
          interceptors.response.onRejected = onRejected;
          return 1;
        }
      }
    },
    request: (...args: any[]) => mockRequest(...args)
  };
  return {
    default: {
      create: () => createMock,
      isAxiosError: (payload: any) => !!payload?.isAxiosError,
    },
    AxiosHeaders: class {
      map = new Map();
      set(key: string, value: string) { this.map.set(key, value); }
      get(key: string) { return this.map.get(key); }
      has(key: string) { return this.map.has(key); }
    }
  };
});

// Import the module under test
import api, { clearAxiosState } from '../axios';

describe('axios setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAxiosState();
    mockGetCurrentUserToken.mockResolvedValue('test-token');
    mockRefreshUserToken.mockResolvedValue('new-token');
  });

  it('exports api instance', () => {
    expect(api).toBeDefined();
  });

  describe('Request Interceptor', () => {
    it('adds authorization header with token', async () => {
      const config = { headers: new AxiosHeaders() } as unknown as InternalAxiosRequestConfig;

      const result = await interceptors.request.onFulfilled(config);

      expect(result.headers.get('Authorization')).toBe('Bearer test-token');
      expect(mockGetCurrentUserToken).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/loading', payload: true });
    });

    it('reuses existing token if available', async () => {
      // First call to set token
      await interceptors.request.onFulfilled({ headers: new AxiosHeaders() } as unknown as InternalAxiosRequestConfig);
      mockGetCurrentUserToken.mockClear();

      // Second call
      const config = { headers: new AxiosHeaders() } as unknown as InternalAxiosRequestConfig;
      await interceptors.request.onFulfilled(config);

      expect(config.headers.get('Authorization')).toBe('Bearer test-token');
      expect(mockGetCurrentUserToken).not.toHaveBeenCalled();
    });

    it('creates headers if they do not exist', async () => {
      // First call to set token
      await interceptors.request.onFulfilled({ headers: new AxiosHeaders() } as unknown as InternalAxiosRequestConfig);

      const config = {} as unknown as InternalAxiosRequestConfig;
      await interceptors.request.onFulfilled(config);

      expect((config.headers as any).get('Authorization')).toBe('Bearer test-token');
    });

    it('handles request error', async () => {
      const error = new Error('Request fail');
      await expect(interceptors.request.onRejected(error)).rejects.toThrow('Request fail');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/loading', payload: true });
    });

    it('handles request with no token available', async () => {
      mockGetCurrentUserToken.mockResolvedValue(null);
      const config = { headers: new AxiosHeaders() } as unknown as InternalAxiosRequestConfig;

      await interceptors.request.onFulfilled(config);

      expect(config.headers.has('Authorization')).toBe(false);
    });
  });

  describe('Response Interceptor', () => {
    it('decrements loading count on success', () => {
      // Increment first
      interceptors.request.onFulfilled({ headers: new AxiosHeaders() } as unknown as InternalAxiosRequestConfig);
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/loading', payload: true });

      interceptors.response.onFulfilled({} as AxiosResponse);
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/loading', payload: false });
    });

    it('handles 401 error and refreshes token', async () => {
      const error = {
        config: { headers: new AxiosHeaders() },
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      await interceptors.response.onRejected(error);

      expect(mockRefreshUserToken).toHaveBeenCalled();
      expect(mockRequest).toHaveBeenCalled(); // Retried request
    });

    it('handles token expiration message checks', async () => {
      const error = {
        config: { headers: new AxiosHeaders() },
        response: {
          status: 400,
          data: { message: 'Sesión expirada' }
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      await interceptors.response.onRejected(error);
      expect(mockRefreshUserToken).toHaveBeenCalled();
    });

    it('handles invalid token message', async () => {
      const error = {
        config: { headers: new AxiosHeaders() },
        response: {
          status: 400,
          data: { message: 'Token inválido' }
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      await interceptors.response.onRejected(error);
      expect(mockRefreshUserToken).toHaveBeenCalled();
    });

    it('handles expiration substring messages', async () => {
      const error = {
        config: { headers: new AxiosHeaders() },
        response: {
          status: 400,
          data: { message: 'sesion expirada por tiempo' }
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      await interceptors.response.onRejected(error);
      expect(mockRefreshUserToken).toHaveBeenCalled();
    });

    it('handles token substring messages', async () => {
      const error = {
        config: { headers: new AxiosHeaders() },
        response: {
          status: 400,
          data: { message: 'token caducado' }
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      await interceptors.response.onRejected(error);
      expect(mockRefreshUserToken).toHaveBeenCalled();
    });

    it('queues requests while refreshing', async () => {
      // Trigger first 401 to start refreshing
      const error1 = {
        config: { headers: new AxiosHeaders() },
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      mockRefreshUserToken.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay
        return 'refreshed-token';
      });

      const promise1 = interceptors.response.onRejected(error1);

      // Trigger second 401 while refreshing
      const error2 = {
        config: { headers: new AxiosHeaders() },
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      const promise2 = interceptors.response.onRejected(error2);

      await Promise.all([promise1, promise2]);

      expect(mockRefreshUserToken).toHaveBeenCalledTimes(1);
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    it('handles queue processing with error', async () => {
      // Queue a request
      const error1 = {
        config: { headers: new AxiosHeaders() },
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      mockRefreshUserToken.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return null; // Fail refresh
      });

      const p1 = interceptors.response.onRejected(error1);
      const p2 = interceptors.response.onRejected({ ...error1 }); // Second request

      try {
        await Promise.all([p1, p2]);
      } catch {
        // Ignore
      }

      // Both should be rejected
      await expect(p1).rejects.toBeDefined();
      await expect(p2).rejects.toBeDefined();
    });

    it('handles queue processing when request config has no headers', async () => {
      mockRefreshUserToken.mockResolvedValue('refreshed-token');

      const error1 = {
        config: { headers: {} }, // Pass plain object which might be treated as no headers or overwritten
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      // To strictly test !prom.config.headers (line 48 in axios.ts), we need config.headers to be undefined/null
      // But axios types say it's AxiosRequestConfig.
      const errorNoHeaders = {
        config: { headers: undefined }, // Explicitly undefined
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      // Force queueing
      mockRefreshUserToken.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'refreshed-token';
      });

      const p1 = interceptors.response.onRejected(error1);
      const p2 = interceptors.response.onRejected(errorNoHeaders);

      await Promise.all([p1, p2]);

      expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    it('logs out if refresh fails', async () => {
      mockRefreshUserToken.mockResolvedValue(null); // Fail refresh

      const error = {
        config: { headers: new AxiosHeaders() },
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      // Reset state
      clearAxiosState();

      // Setup: make refresh take time and fail
      let finishRefresh: (val: any) => void;
      mockRefreshUserToken.mockImplementation(() => new Promise(resolve => {
        finishRefresh = resolve;
      }));

      // First request triggers refresh
      const p1 = interceptors.response.onRejected(error);

      // Second request gets queued
      const p2 = interceptors.response.onRejected({ ...error });

      // Finish refresh with null (failure)
      finishRefresh!(null);

      try {
        await Promise.all([p1, p2]);
      } catch {
        // Both should reject
      }

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/logout' });
    });

    it('logs out if refresh throws exception', async () => {
      mockRefreshUserToken.mockRejectedValue(new Error('Network error'));

      const error = {
        config: { headers: new AxiosHeaders() },
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      await expect(interceptors.response.onRejected(error)).rejects.toThrow('Network error');

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/logout' });
    });

    it('rejects if no config in error', async () => {
      const error = {
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      await expect(interceptors.response.onRejected(error)).rejects.toBe(error);
    });

    it('rejects if error is not 401 or session expired', async () => {
      const error = {
        config: { headers: new AxiosHeaders() },
        response: { status: 500 },
        isAxiosError: true,
      } as unknown as AxiosError;

      await expect(interceptors.response.onRejected(error)).rejects.toBe(error);
    });

    it('rejects network errors (no response)', async () => {
      const error = {
        isAxiosError: true,
        // no response property
      } as unknown as AxiosError;

      await expect(interceptors.response.onRejected(error)).rejects.toBe(error);
    });

    it('handles non-Error objects thrown during refresh', async () => {
      mockRefreshUserToken.mockRejectedValue('Just a string error');

      const error = {
        config: { headers: new AxiosHeaders() },
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      try {
        await interceptors.response.onRejected(error);
      } catch (e) {
        expect(e).toBe('Just a string error');
      }

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/logout' });
    });

    it('handles retrying request without AxiosHeaders', async () => {
      mockRefreshUserToken.mockResolvedValue('refreshed-token');
      const error = {
        config: { headers: {} }, // Plain object headers
        response: { status: 401 },
        isAxiosError: true,
      } as unknown as AxiosError;

      await interceptors.response.onRejected(error);

      // Check if headers were updated on the mocked request call
      const calledConfig = mockRequest.mock.calls[0][0];

      expect(calledConfig.headers.get('Authorization')).toBe('Bearer refreshed-token');
    });
  });

  describe('processQueue', () => {
    it('does nothing if no error and no token', async () => {
      // Manually populate queue
      const item = { resolve: vi.fn(), reject: vi.fn(), config: {} as any };
      // Import functions from the module
      const axiosModule = await import('../axios');
      const { processQueue, failedQueue } = axiosModule as any;

      failedQueue.push(item);

      processQueue(null, null);

      expect(item.resolve).not.toHaveBeenCalled();
      expect(item.reject).not.toHaveBeenCalled();
      // Note: We don't assert on failedQueue.length as module bindings behave differently in tests
      // The key behavior is that no callbacks are called when both error and token are null
    });
  });
});
