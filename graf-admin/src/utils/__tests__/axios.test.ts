import { afterEach, describe, expect, it, vi } from 'vitest';

type RequestHandler = {
  onFulfilled: (config: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onRejected: (error: Error) => Promise<never>;
};

type ResponseHandler = {
  onFulfilled: (response: unknown) => unknown;
  onRejected: (error: Record<string, unknown>) => Promise<unknown>;
};

const axiosMocks = vi.hoisted(() => {
  const requestHandlers: RequestHandler[] = [];
  const responseHandlers: ResponseHandler[] = [];
  const api = {
    interceptors: {
      request: {
        use: vi.fn((onFulfilled, onRejected) => {
          requestHandlers.push({ onFulfilled, onRejected });
        }),
      },
      response: {
        use: vi.fn((onFulfilled, onRejected) => {
          responseHandlers.push({ onFulfilled, onRejected });
        }),
      },
    },
    request: vi.fn(),
  };
  const create = vi.fn(() => api);
  class AxiosHeaders {
    values: Record<string, string> = {};
    set(key: string, value: string) {
      this.values[key] = value;
    }
  }
  return { api, create, requestHandlers, responseHandlers, AxiosHeaders };
});

const storeMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
}));

const uiMocks = vi.hoisted(() => ({
  loading: vi.fn((value: boolean) => ({ type: 'ui/loading', payload: value })),
  addNotification: vi.fn((payload: { message: string; color?: string }) => ({
    type: 'ui/addNotification',
    payload,
  })),
}));

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(() => ({ type: 'auth/logout' })),
}));

const firebaseMocks = vi.hoisted(() => ({
  getCurrentUserToken: vi.fn(),
  refreshUserToken: vi.fn(),
}));

vi.mock('axios', () => ({
  default: { create: axiosMocks.create },
  AxiosHeaders: axiosMocks.AxiosHeaders,
}));

vi.mock('../env', () => ({
  env: { NEXT_PUBLIC_API_URL: 'http://api.test' },
}));

vi.mock('../../redux/store', () => ({
  default: { dispatch: storeMocks.dispatch },
}));

vi.mock('../../redux/ui', () => ({
  loading: uiMocks.loading,
  addNotification: uiMocks.addNotification,
}));

vi.mock('../firebaseHelper', () => ({
  getCurrentUserToken: firebaseMocks.getCurrentUserToken,
  refreshUserToken: firebaseMocks.refreshUserToken,
}));

vi.mock('../../redux/auth', () => ({
  logout: authMocks.logout,
}));

const resetMocks = () => {
  axiosMocks.requestHandlers.length = 0;
  axiosMocks.responseHandlers.length = 0;
  axiosMocks.api.request.mockReset();
  axiosMocks.api.interceptors.request.use.mockClear();
  axiosMocks.api.interceptors.response.use.mockClear();
  axiosMocks.create.mockClear();
  storeMocks.dispatch.mockClear();
  uiMocks.loading.mockClear();
  uiMocks.addNotification.mockClear();
  authMocks.logout.mockClear();
  firebaseMocks.getCurrentUserToken.mockReset();
  firebaseMocks.refreshUserToken.mockReset();
};

const loadAxiosModule = async () => {
  vi.resetModules();
  resetMocks();
  const axiosModule = await import('../axios');
  return {
    axiosModule,
    requestHandler: axiosMocks.requestHandlers[0],
    responseHandler: axiosMocks.responseHandlers[0],
  };
};

const makeAuthError = (overrides: Record<string, unknown> = {}) => ({
  config: { url: '/orders', headers: {} },
  response: { status: 401, data: {} },
  ...overrides,
});

const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
const originalWindow = globalThis.window;

afterEach(() => {
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
  vi.useRealTimers();
});

describe('axios utils', () => {
  it('creates the axios client with base URL and headers', async () => {
    await loadAxiosModule();

    expect(axiosMocks.create).toHaveBeenCalledWith({
      baseURL: 'http://api.test',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    expect(axiosMocks.requestHandlers).toHaveLength(1);
    expect(axiosMocks.responseHandlers).toHaveLength(1);
  });

  it('adds Authorization header and caches the token', async () => {
    const { axiosModule, requestHandler } = await loadAxiosModule();
    firebaseMocks.getCurrentUserToken.mockResolvedValue('token-1');

    const configA: Record<string, unknown> = { headers: {} };
    await requestHandler.onFulfilled(configA);

    expect(firebaseMocks.getCurrentUserToken).toHaveBeenCalledTimes(1);
    expect(uiMocks.loading).toHaveBeenCalledWith(true);
    expect(storeMocks.dispatch).toHaveBeenCalled();
    expect(configA.headers).toBeInstanceOf(axiosMocks.AxiosHeaders);
    expect((configA.headers as InstanceType<typeof axiosMocks.AxiosHeaders>).values.Authorization).toBe(
      'Bearer token-1',
    );

    const configB: Record<string, unknown> = { headers: {} };
    await requestHandler.onFulfilled(configB);
    expect(firebaseMocks.getCurrentUserToken).toHaveBeenCalledTimes(1);

    axiosModule.clearAxiosState();
    await requestHandler.onFulfilled({ headers: {} });
    expect(firebaseMocks.getCurrentUserToken).toHaveBeenCalledTimes(2);
  });

  it('uses existing AxiosHeaders instances', async () => {
    const { requestHandler } = await loadAxiosModule();
    firebaseMocks.getCurrentUserToken.mockResolvedValue('token-2');

    const headers = new axiosMocks.AxiosHeaders();
    const setSpy = vi.spyOn(headers, 'set');
    const config: Record<string, unknown> = { headers };
    await requestHandler.onFulfilled(config);

    expect(setSpy).toHaveBeenCalledWith('Authorization', 'Bearer token-2');
  });

  it('updates loading state on response success', async () => {
    const { requestHandler, responseHandler } = await loadAxiosModule();
    firebaseMocks.getCurrentUserToken.mockResolvedValue('token-3');

    await requestHandler.onFulfilled({ headers: {} });
    responseHandler.onFulfilled({ data: 'ok' });

    expect(uiMocks.loading).toHaveBeenCalledWith(true);
    expect(uiMocks.loading).toHaveBeenCalledWith(false);
  });

  it('logs and rejects request errors', async () => {
    const { requestHandler } = await loadAxiosModule();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('request failed');

    await expect(requestHandler.onRejected(error)).rejects.toBe(error);

    expect(uiMocks.loading).toHaveBeenCalledWith(true);
    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });

  it('rejects when response error lacks config', async () => {
    const { responseHandler } = await loadAxiosModule();
    const error = { response: { status: 500 } };

    await expect(responseHandler.onRejected(error)).rejects.toEqual(error);
  });

  it('treats messages containing "expirada" as auth errors', async () => {
    const { responseHandler } = await loadAxiosModule();
    const error = {
      config: { url: '/public', headers: {} },
      response: { status: 400, data: { message: 'Sesion expirada en dispositivo' } },
    };

    firebaseMocks.refreshUserToken.mockResolvedValue('new-token');
    axiosMocks.api.request.mockResolvedValue({ ok: true });

    const result = await responseHandler.onRejected(error);

    expect(firebaseMocks.refreshUserToken).toHaveBeenCalledTimes(1);
    expect(axiosMocks.api.request).toHaveBeenCalledWith(error.config);
    expect(result).toEqual({ ok: true });
  });

  it('treats messages containing "token" as auth errors', async () => {
    const { responseHandler } = await loadAxiosModule();
    const error = {
      config: { url: '/public', headers: {} },
      response: { status: 400, data: { message: 'token vencido en app' } },
    };

    firebaseMocks.refreshUserToken.mockResolvedValue('new-token');
    axiosMocks.api.request.mockResolvedValue({ ok: true });

    const result = await responseHandler.onRejected(error);

    expect(firebaseMocks.refreshUserToken).toHaveBeenCalledTimes(1);
    expect(axiosMocks.api.request).toHaveBeenCalledWith(error.config);
    expect(result).toEqual({ ok: true });
  });

  it('refreshes token and updates existing AxiosHeaders on the original request', async () => {
    const { responseHandler } = await loadAxiosModule();
    const headers = new axiosMocks.AxiosHeaders();
    const originalRequest = { url: '/orders', headers };

    firebaseMocks.refreshUserToken.mockResolvedValue('new-token');
    axiosMocks.api.request.mockResolvedValue({ ok: true });

    const result = await responseHandler.onRejected(
      makeAuthError({ config: originalRequest }),
    );

    expect(headers.values.Authorization).toBe('Bearer new-token');
    expect(axiosMocks.api.request).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ ok: true });
  });

  it('refreshes token and processes queued requests', async () => {
    const { responseHandler } = await loadAxiosModule();
    const originalRequest = { url: '/orders', headers: {} };
    const queuedRequest = { url: '/orders', headers: undefined as undefined | Record<string, string> };
    let resolveRefresh: (value: string) => void;
    const refreshPromise = new Promise<string>((resolve) => {
      resolveRefresh = resolve;
    });

    firebaseMocks.refreshUserToken.mockReturnValue(refreshPromise);
    axiosMocks.api.request.mockResolvedValue({ ok: true });

    const pendingRefresh = responseHandler.onRejected(
      makeAuthError({ config: originalRequest }),
    );
    const queued = responseHandler.onRejected(makeAuthError({ config: queuedRequest }));

    resolveRefresh!('new-token');
    const [refreshResult, queuedResult] = await Promise.all([pendingRefresh, queued]);

    expect(firebaseMocks.refreshUserToken).toHaveBeenCalledTimes(1);
    expect(axiosMocks.api.request).toHaveBeenCalledTimes(2);
    expect(originalRequest.headers).toBeInstanceOf(axiosMocks.AxiosHeaders);
    expect(
      (originalRequest.headers as InstanceType<typeof axiosMocks.AxiosHeaders>).values.Authorization,
    ).toBe('Bearer new-token');
    expect(queuedRequest.headers?.Authorization).toBe('Bearer new-token');
    expect(refreshResult).toEqual({ ok: true });
    expect(queuedResult).toEqual({ ok: true });
  });

  it('handles refresh failure with notification and redirect', async () => {
    const { responseHandler } = await loadAxiosModule();
    const location = { href: '' };
    Object.defineProperty(globalThis, 'window', {
      value: { location },
      writable: true,
    });
    vi.useFakeTimers();

    firebaseMocks.refreshUserToken.mockResolvedValue(null);
    const error = makeAuthError({ config: { url: '/orders', headers: {} } });

    await expect(responseHandler.onRejected(error)).rejects.toBe(error);

    expect(uiMocks.addNotification).toHaveBeenCalledWith({
      message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
      color: 'warning',
    });
    expect(storeMocks.dispatch).toHaveBeenCalledWith(
      uiMocks.addNotification.mock.results[0]?.value,
    );
    expect(storeMocks.dispatch).toHaveBeenCalledWith(authMocks.logout.mock.results[0]?.value);

    await vi.runAllTimersAsync();
    expect(location.href).toBe('/login');
  });

  it('handles refresh exceptions with notification and redirect', async () => {
    const { responseHandler } = await loadAxiosModule();
    const location = { href: '' };
    Object.defineProperty(globalThis, 'window', {
      value: { location },
      writable: true,
    });
    vi.useFakeTimers();

    firebaseMocks.refreshUserToken.mockRejectedValue('boom');
    const error = makeAuthError({ config: { url: '/orders', headers: {} } });

    await expect(responseHandler.onRejected(error)).rejects.toBe('boom');

    expect(uiMocks.addNotification).toHaveBeenCalledWith({
      message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
      color: 'warning',
    });
    expect(storeMocks.dispatch).toHaveBeenCalledWith(
      uiMocks.addNotification.mock.results[0]?.value,
    );
    expect(storeMocks.dispatch).toHaveBeenCalledWith(authMocks.logout.mock.results[0]?.value);

    await vi.runAllTimersAsync();
    expect(location.href).toBe('/login');
  });

  it('rejects queued requests when refresh throws', async () => {
    const { responseHandler } = await loadAxiosModule();
    let rejectRefresh: (reason: Error) => void;
    const refreshPromise = new Promise<string>((_resolve, reject) => {
      rejectRefresh = reject;
    });
    const refreshError = new Error('refresh failed');

    firebaseMocks.refreshUserToken.mockReturnValue(refreshPromise);

    const originalRequest = { url: '/orders', headers: {} };
    const queuedRequest = { url: '/orders', headers: {} };

    const pending = responseHandler.onRejected(makeAuthError({ config: originalRequest }));
    const queued = responseHandler.onRejected(makeAuthError({ config: queuedRequest }));

    rejectRefresh!(refreshError);

    await expect(pending).rejects.toBe(refreshError);
    await expect(queued).rejects.toBe(refreshError);
  });

  it('logs and rejects non-auth errors', async () => {
    const { responseHandler } = await loadAxiosModule();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const error = {
      config: { url: '/orders', headers: {} },
      response: { status: 500, data: {} },
    };

    await expect(responseHandler.onRejected(error)).rejects.toBe(error);

    expect(consoleSpy).toHaveBeenCalledWith(error);
  });
});
