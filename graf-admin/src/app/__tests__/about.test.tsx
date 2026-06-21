/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import AboutPage from '../about/page';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

afterEach(() => cleanup());

const findNextInputValue = (node: React.ReactNode): string | undefined => {
  if (!node) return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNextInputValue(child);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<any>;
    if (element.type === 'input' && element.props?.name === '_next') {
      return element.props.value as string;
    }
    return findNextInputValue(element.props?.children);
  }

  return undefined;
};

describe('AboutPage', () => {
  it('renders hero content and contact CTA', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { name: 'Prizma' })).toBeTruthy();
    expect(screen.getByText(/Tecnolog.a al servicio de tu crecimiento/i)).toBeTruthy();

    const cta = screen.getByText(/Cont.ctanos hoy/i).closest('a');
    expect(cta).not.toBeNull();
    expect(cta?.getAttribute('href')).toContain('wa.me/573246780067');
  });

  it('renders services and contact information', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { name: /Nuestros Servicios/i })).toBeTruthy();

    [
      'Desarrollo de Software a Medida',
      'Sistemas de Gestión',
      'Plataformas de E-Commerce',
      'Soporte Técnico',
    ].forEach((title) => {
      expect(screen.getByText(title)).toBeTruthy();
    });

    expect(screen.getByRole('heading', { name: /Cont.ctanos/i })).toBeTruthy();
    expect(screen.getByText(/ventas@prizma.app/i)).toBeTruthy();
  });

  it('uses an empty next value when window is missing', () => {
    const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const element = (AboutPage as any)({});
    const nextValue = findNextInputValue(element);

    if (hadWindow) {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    } else {
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    }

    expect(nextValue).toBe('');
  });
});
