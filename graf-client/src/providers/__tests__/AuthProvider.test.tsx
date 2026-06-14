/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock useFirebaseAuth hook
vi.mock('@/hooks/useFirebaseAuth', () => ({
  default: vi.fn(),
}));

// Import after mocks
import { AuthProvider } from '../AuthProvider';

describe('AuthProvider', () => {
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

  it('renders children', async () => {
    await act(async () => {
      root.render(
        <AuthProvider>
          <div data-testid="child">Child Content</div>
        </AuthProvider>
      );
    });

    const child = container.querySelector('[data-testid="child"]');
    expect(child).toBeTruthy();
    expect(child?.textContent).toBe('Child Content');
  });

  it('calls useFirebaseAuth hook', async () => {
    const useFirebaseAuth = (await import('@/hooks/useFirebaseAuth')).default;

    await act(async () => {
      root.render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );
    });

    expect(useFirebaseAuth).toHaveBeenCalled();
  });
});
