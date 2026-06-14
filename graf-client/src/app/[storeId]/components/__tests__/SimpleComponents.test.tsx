/* @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import StoreNotFound from '../StoreNotFound';
import StoreNotConfigured from '../StoreNotConfigured';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('StoreNotFound', () => {
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    if (container) {
      container.remove();
      container = null;
    }
  });

  it('renders correctly', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      createRoot(container!).render(<StoreNotFound />);
    });

    expect(container.textContent).toContain('¡Ups! no existe la tienda');
    expect(container.textContent).toContain('Volver al inicio');
  });
});

describe('StoreNotConfigured', () => {
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    if (container) {
      container.remove();
      container = null;
    }
  });

  it('renders correctly', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      createRoot(container!).render(<StoreNotConfigured />);
    });
    expect(container.textContent).toContain('Tienda en configuración');
    expect(container.textContent).toContain('Esta tienda existe pero aún no ha sido configurada');
  });
});
