// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ClientHome from '../ClientHome';
import axios from '@/utils/axios';

// Mock dependencies
vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}));

describe('ClientHome', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('renders heading and features', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: [] });

    await act(async () => {
      root.render(<ClientHome />);
    });

    expect(container.textContent).toContain('Graf: Tu Ecommerce Personalizado');
    expect(container.textContent).toContain('¿Por qué elegir Graf para tu negocio?');
    expect(container.textContent).toContain('Alta personalización');
  });

  it('fetches and renders stores', async () => {
    const mockStores = [
      { id: '1', name: 'Store 1', description: 'Desc 1', configuration: { logo: '/logo.png' } },
      { id: '2', name: 'Store 2' } // No logo, no desc
    ];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockStores });

    await act(async () => {
      root.render(<ClientHome />);
    });

    expect(axios.get).toHaveBeenCalledWith('/store');

    // Wait for state update - effectively handled by act?
    // But getStores is async. We might need a small delay or loop.
    await new Promise(r => setTimeout(r, 100)); // Simple wait for effect

    expect(container.textContent).toContain('Store 1');
    expect(container.textContent).toContain('Desc 1');
    expect(container.textContent).toContain('Store 2');

    const imgs = Array.from(container.querySelectorAll('img'));
    expect(imgs.some(img => img.getAttribute('src') === '/logo.png')).toBe(true);
  });

  it('renders admin link correctly', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: [] });
    process.env.NEXT_PUBLIC_ADMIN_URL = 'http://admin.com';

    await act(async () => {
      root.render(<ClientHome />);
    });

    const link = container.querySelector('a[href="http://admin.com"]');
    expect(link).toBeDefined();
    expect(link?.textContent).toContain('Crea tu propia tienda');
  });
});
