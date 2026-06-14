/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import useFirebaseAuth from '../useFirebaseAuth';

// Mock dependencies
const dispatchMock = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
}));

// Mock Actions
vi.mock('@/redux/auth', () => ({
  logout: vi.fn(() => ({ type: 'auth/logout' })),
}));
import { logout } from '@/redux/auth';

// Mock Firebase
const unsubscribeMock = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onAuthStateChangedMock = vi.fn((..._args: any[]) => {
  // We can manually invoke the callback in tests if we want to simulate state change
  // return unsubscribe function
  return unsubscribeMock;
});

vi.mock('@/utils/firebase', () => ({
  auth: {
    onAuthStateChanged: (cb: any) => onAuthStateChangedMock(cb),
  },
}));

let container: HTMLDivElement;
let root: Root;

const TestComponent = () => {
  useFirebaseAuth();
  return null;
};

const renderHook = async () => {
  await act(async () => {
    root.render(<TestComponent />);
  });
};

describe('useFirebaseAuth', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    dispatchMock.mockReset();
    unsubscribeMock.mockReset();
    onAuthStateChangedMock.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('subscribes to onAuthStateChanged on mount', async () => {
    await renderHook();
    expect(onAuthStateChangedMock).toHaveBeenCalled();
  });

  it('unsubscribes on unmount', async () => {
    await renderHook();
    act(() => {
      root.unmount();
    });
    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('dispatches logout when user is null', async () => {
    await renderHook();

    const callback = onAuthStateChangedMock.mock.calls[0][0];

    await act(async () => {
      callback(null);
    });

    expect(dispatchMock).toHaveBeenCalled();
    expect(logout).toHaveBeenCalled();
  });

  it('does NOT dispatch logout when user is present', async () => {
    await renderHook();

    const callback = onAuthStateChangedMock.mock.calls[0][0];

    await act(async () => {
      callback({ uid: '123' });
    });

    expect(dispatchMock).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });
});
