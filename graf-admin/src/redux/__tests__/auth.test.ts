import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Subscription, User } from '../../types';

const mocks = vi.hoisted(() => ({
  signOutUser: vi.fn(),
  clearAxiosState: vi.fn(),
  resetAppState: vi.fn(() => ({ type: 'app/reset' })),
}));

vi.mock('../../utils/firebaseHelper', () => ({
  signOutUser: mocks.signOutUser,
}));

vi.mock('../../utils/axios', () => ({
  clearAxiosState: mocks.clearAxiosState,
}));

vi.mock('../actions', () => ({
  resetAppState: mocks.resetAppState,
  RESET_APP_STATE: 'app/reset',
}));

import authReducer, { initializeAuth, login, logout, setSuscription } from '../auth';

const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
const originalWindow = globalThis.window;
const hadLocalStorage = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage');
const originalLocalStorage = globalThis.localStorage;

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const setWindow = () => {
  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: localStorageMock,
    },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  setWindow();
});

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
  if (hadLocalStorage) {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
});

describe('auth reducer', () => {
  it('logs in and stores user data', () => {
    const user = { id: 'user-1' } as User;
    const state = authReducer(undefined, login(user));

    expect(state.isLoggedIn).toBe(true);
    expect(state.userData).toBe(user);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('userData', JSON.stringify(user));
  });

  it('sets subscription on existing user', () => {
    const user = { id: 'user-2' } as User;
    const subscription = { id: 1 } as Subscription;
    const state = authReducer({ isLoggedIn: true, userData: user }, setSuscription(subscription));

    expect(state.userData?.subscription).toBe(subscription);
  });

  it('initializes from localStorage', () => {
    const user = { id: 'user-3' } as User;
    localStorageMock.getItem.mockReturnValue(JSON.stringify(user));

    const state = authReducer(undefined, initializeAuth());

    expect(state.isLoggedIn).toBe(true);
    expect(state.userData).toEqual(user);
  });

  it('logs out via reducer', () => {
    const state = authReducer({ isLoggedIn: true, userData: { id: 'user-4' } as User }, { type: 'auth/logout' });

    expect(state.isLoggedIn).toBe(false);
    expect(state.userData).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userData');
    expect(mocks.signOutUser).toHaveBeenCalledTimes(1);
  });
});

describe('logout thunk', () => {
  it('dispatches reset and clears axios state', async () => {
    const dispatch = vi.fn();

    await logout()(dispatch);

    expect(mocks.resetAppState).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'app/reset' });
    expect(mocks.signOutUser).toHaveBeenCalledTimes(1);
    expect(mocks.clearAxiosState).toHaveBeenCalledTimes(1);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userData');
  });

  it('logs errors and still clears axios state', async () => {
    const error = new Error('logout failed');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.signOutUser.mockRejectedValueOnce(error);
    const dispatch = vi.fn();

    await logout()(dispatch);

    expect(consoleSpy).toHaveBeenCalledWith('Error during logout:', error);
    expect(mocks.clearAxiosState).toHaveBeenCalledTimes(1);
  });
});
