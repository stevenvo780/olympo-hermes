/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import useFirebaseAuth from '../useFirebaseAuth';
import { addNotification } from '@/redux/ui';

const authMocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  currentUser: null as
    | null
    | {
      getIdTokenResult: () => Promise<{ expirationTime: string }>;
      getIdToken: (forceRefresh: boolean) => Promise<string>;
    },
}));

const dispatchMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
}));

const reduxState = vi.hoisted(() => ({
  state: { auth: { isLoggedIn: true } },
}));

vi.mock('@/utils/firebase', () => ({
  auth: authMocks,
}));

vi.mock('@/redux/hooks', () => ({
  useAppDispatch: () => dispatchMocks.dispatch,
}));

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: typeof reduxState.state) => unknown) =>
    selector(reduxState.state),
}));

vi.mock('@/redux/ui', () => ({
  addNotification: vi.fn((payload: { message: string; color?: string }) => ({
    type: 'ui/addNotification',
    payload,
  })),
}));

vi.mock('@/redux/auth', () => ({
  logout: vi.fn(() => ({ type: 'auth/logout' })),
}));

const TestComponent = () => {
  useFirebaseAuth();
  return null;
};

afterEach(() => {
  cleanup();
  authMocks.onAuthStateChanged.mockReset();
  authMocks.currentUser = null;
  dispatchMocks.dispatch.mockClear();
  reduxState.state.auth.isLoggedIn = true;
});

describe('useFirebaseAuth', () => {
  it('dispatches notification and logout when auth state is cleared', async () => {
    authMocks.onAuthStateChanged.mockImplementation((callback: (user: unknown) => void) => {
      callback(null);
      return vi.fn();
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'warning' })
      );
      expect(dispatchMocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ui/addNotification' })
      );
      expect(dispatchMocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth/logout' })
      );
    });
  });

  it('renews the token when expiration is near', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const getIdTokenResult = vi.fn().mockResolvedValue({
      expirationTime: new Date(Date.now() + 60 * 1000).toISOString(),
    });
    const getIdToken = vi.fn().mockResolvedValue('token');

    authMocks.currentUser = { getIdTokenResult, getIdToken };
    authMocks.onAuthStateChanged.mockImplementation((callback: (user: unknown) => void) => {
      callback(authMocks.currentUser);
      return vi.fn();
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(getIdTokenResult).toHaveBeenCalled();
      expect(getIdToken).toHaveBeenCalledWith(true);
    });
    logSpy.mockRestore();
  });

  it('dispatches logout when token validation fails', async () => {
    const error = new Error('token invalid');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const getIdTokenResult = vi.fn().mockRejectedValue(error);
    const getIdToken = vi.fn().mockResolvedValue('token');

    authMocks.currentUser = { getIdTokenResult, getIdToken };
    authMocks.onAuthStateChanged.mockImplementation((callback: (user: unknown) => void) => {
      callback(authMocks.currentUser);
      return vi.fn();
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'warning' })
      );
      expect(dispatchMocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ui/addNotification' })
      );
      expect(dispatchMocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth/logout' })
      );
    });

    expect(errorSpy).toHaveBeenCalledWith('Error validando/renovando token:', error);
    errorSpy.mockRestore();
  });
});
