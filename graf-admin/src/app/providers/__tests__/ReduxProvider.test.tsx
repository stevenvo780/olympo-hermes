/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ReduxProvider } from '../ReduxProvider';

const storeMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  initializeAuth: vi.fn(() => ({ type: 'auth/initialize' })),
}));

vi.mock('@/redux/store', () => ({
  default: {
    dispatch: storeMocks.dispatch,
  },
  persistor: {
    persist: vi.fn(),
  },
}));

vi.mock('@/redux/auth', () => ({
  initializeAuth: authMocks.initializeAuth,
}));

vi.mock('react-redux', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="provider">{children}</div>
  ),
}));

vi.mock('redux-persist/integration/react', () => ({
  PersistGate: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="persist">{children}</div>
  ),
}));

afterEach(() => {
  cleanup();
  storeMocks.dispatch.mockClear();
  authMocks.initializeAuth.mockClear();
});

describe('ReduxProvider', () => {
  it('dispatches initializeAuth and renders children after mount', async () => {
    render(
      <ReduxProvider>
        <div>content</div>
      </ReduxProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('content')).toBeTruthy();
    });

    expect(authMocks.initializeAuth).toHaveBeenCalledTimes(1);
    expect(storeMocks.dispatch).toHaveBeenCalledWith({ type: 'auth/initialize' });
  });
});
