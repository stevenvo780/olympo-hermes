/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import RootLayout from '../layout';

vi.mock('@/providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="analytics" />,
}));

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

describe('RootLayout', () => {
  it('renders children within providers and includes analytics', async () => {
    await act(async () => {
      root.render(
        <RootLayout>
          <div>Test Child</div>
        </RootLayout>
      );
    });

    expect(container.textContent).toContain('Test Child');
    // Since we mocked Providers to render children inside data-testid="providers"
    // We can check if that element exists in container
    const providers = container.querySelector('[data-testid="providers"]');
    expect(providers).toBeTruthy();

    // Analytics
    const analytics = container.querySelector('[data-testid="analytics"]');
    expect(analytics).toBeTruthy();
  });
});
