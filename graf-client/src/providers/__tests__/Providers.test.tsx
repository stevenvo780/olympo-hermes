/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

vi.mock('../ReduxProvider', () => ({
  ReduxProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="redux-provider">{children}</div>
  ),
}));

vi.mock('../AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

import { Providers } from '../index';

describe('Providers', () => {
  it('wraps children with ReduxProvider and AuthProvider', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <Providers>
          <div data-testid="child">Child</div>
        </Providers>
      );
    });

    expect(container.querySelector('[data-testid="redux-provider"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="auth-provider"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe('Child');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
