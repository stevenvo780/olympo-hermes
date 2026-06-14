'use client';
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosHeaders
} from 'axios';
import { env } from './env';
import store from '../redux/store';
import { loading, addNotification } from '../redux/ui';
import { getCurrentUserToken, refreshUserToken } from './firebaseHelper';
import { logout } from '../redux/auth';

const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: AxiosRequestConfig;
}

interface ApiErrorResponse {
  message?: string;
  [key: string]: unknown;
}

let activeCalls = 0;
let token: string | null = null;
let isRefreshing = false;
export let failedQueue: QueueItem[] = [];

const updateLoadingState = (): void => {
  store.dispatch(loading(activeCalls > 0));
};

export const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      if (!prom.config.headers) {
        prom.config.headers = {};
      }
      prom.config.headers = {
        ...prom.config.headers,
        Authorization: `Bearer ${token}`
      };
      prom.resolve(api.request(prom.config));
    }
  });

  failedQueue = [];
};

export const clearAxiosState = () => {
  token = null;
  isRefreshing = false;
  failedQueue = [];
  activeCalls = 0;
};

api.interceptors.request.use(
  async function (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    activeCalls++;
    updateLoadingState();
    if (!token) {
      token = await getCurrentUserToken();
    }

    if (token) {
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        const headers = new AxiosHeaders();
        headers.set('Authorization', `Bearer ${token}`);
        config.headers = headers;
      }
    }

    if (process.env.NEXT_PUBLIC_DEMO_API_KEY) {
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set('x-api-key', process.env.NEXT_PUBLIC_DEMO_API_KEY);
      } else {
        const headers = new AxiosHeaders(config.headers);
        headers.set('x-api-key', process.env.NEXT_PUBLIC_DEMO_API_KEY);
        config.headers = headers;
      }
    }

    return config;
  },
  function (error: AxiosError): Promise<never> {
    activeCalls++;
    updateLoadingState();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  function (response: AxiosResponse): AxiosResponse {
    activeCalls = Math.max(0, activeCalls - 1);
    updateLoadingState();
    return response;
  },
  async function (error: AxiosError): Promise<unknown> {
    activeCalls = Math.max(0, activeCalls - 1);
    updateLoadingState();

    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (error.response && (
      error.response.status === 401 ||
      (error.response.data &&
        typeof error.response.data === 'object' &&
        ((error.response.data as ApiErrorResponse).message === 'Sesión expirada' ||
          (error.response.data as ApiErrorResponse).message === 'Token inválido' ||
          (error.response.data as ApiErrorResponse).message?.includes('expirada') ||
          (error.response.data as ApiErrorResponse).message?.includes('token'))))) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshUserToken();

        if (newToken) {
          token = newToken;

          if (originalRequest.headers instanceof AxiosHeaders) {
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
          } else {
            const headers = new AxiosHeaders();
            headers.set('Authorization', `Bearer ${newToken}`);
            originalRequest.headers = headers;
          }

          processQueue(null, newToken);

          return api.request(originalRequest);
        } else {
          const tokenError = new Error('No se pudo renovar el token');
          processQueue(tokenError);
          store.dispatch(addNotification({
            message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
            color: 'warning'
          }));
          store.dispatch(logout());
          return Promise.reject(error);
        }
      } catch (refreshError) {
        const typedError = refreshError instanceof Error
          ? refreshError
          : new Error('Error desconocido al renovar el token');

        processQueue(typedError);
        store.dispatch(addNotification({
          message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
          color: 'warning'
        }));
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
