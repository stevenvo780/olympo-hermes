/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock LoginClient
vi.mock('@/components/LoginClient', () => ({
  default: ({ storeId }: { storeId: string }) => (
    <div data-testid="login-client" data-store-id={storeId}>LoginClient</div>
  ),
}));

// Mock providers
vi.mock('@/providers/ReduxProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/providers/AuthProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import after mocks
import LoginPage from '../page';

describe('LoginPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders LoginClient component', async () => {
    await act(async () => {
      root.render(<LoginPage />);
    });

    const loginClient = container.querySelector('[data-testid="login-client"]');
    expect(loginClient).toBeTruthy();
  });

  it('passes empty storeId to LoginClient', async () => {
    await act(async () => {
      root.render(<LoginPage />);
    });

    const loginClient = container.querySelector('[data-testid="login-client"]');
    expect(loginClient?.getAttribute('data-store-id')).toBe('');
  });
});
