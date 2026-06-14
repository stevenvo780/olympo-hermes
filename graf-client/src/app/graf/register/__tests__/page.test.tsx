/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock RegisterClient
vi.mock('@/components/RegisterClient', () => ({
  default: ({ storeId }: { storeId: string }) => (
    <div data-testid="register-client" data-store-id={storeId}>RegisterClient</div>
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
import RegisterPage from '../page';

describe('RegisterPage', () => {
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

  it('renders RegisterClient component', async () => {
    await act(async () => {
      root.render(<RegisterPage />);
    });

    const registerClient = container.querySelector('[data-testid="register-client"]');
    expect(registerClient).toBeTruthy();
  });

  it('passes empty storeId to RegisterClient', async () => {
    await act(async () => {
      root.render(<RegisterPage />);
    });

    const registerClient = container.querySelector('[data-testid="register-client"]');
    expect(registerClient?.getAttribute('data-store-id')).toBe('');
  });
});
