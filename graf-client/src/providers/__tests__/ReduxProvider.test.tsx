/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock redux store
const mockDispatch = vi.fn();

vi.mock('@/redux/store', () => ({
  default: {
    dispatch: (...args: unknown[]) => mockDispatch(...args),
    getState: vi.fn(),
    subscribe: vi.fn(),
  },
  persistor: {
    subscribe: vi.fn(),
    getState: vi.fn(() => ({ bootstrapped: true })),
  },
}));

vi.mock('@/redux/auth', () => ({
  initializeAuth: () => ({ type: 'auth/initializeAuth' }),
}));

// Mock react-redux Provider
vi.mock('react-redux', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock redux-persist PersistGate
vi.mock('redux-persist/integration/react', () => ({
  PersistGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import after mocks
import { ReduxProvider } from '../ReduxProvider';

describe('ReduxProvider', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it('renders null initially on server side (before useEffect)', async () => {
    // First render should return null since isClient is false
    await act(async () => {
      root.render(
        <ReduxProvider>
          <div data-testid="child">Child Content</div>
        </ReduxProvider>
      );
    });

    // After useEffect runs (simulated by advancing timers), it should render children
    await act(async () => {
      vi.runAllTimers();
    });

    const child = container.querySelector('[data-testid="child"]');
    expect(child).toBeTruthy();
  });

  it('dispatches initializeAuth on mount', async () => {
    await act(async () => {
      root.render(
        <ReduxProvider>
          <div>Test</div>
        </ReduxProvider>
      );
      vi.runAllTimers();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/initializeAuth' });
  });

  it('renders children after client-side hydration', async () => {
    await act(async () => {
      root.render(
        <ReduxProvider>
          <div data-testid="child">Child Content</div>
        </ReduxProvider>
      );
      vi.runAllTimers();
    });

    const child = container.querySelector('[data-testid="child"]');
    expect(child).toBeTruthy();
    expect(child?.textContent).toBe('Child Content');
  });
});
