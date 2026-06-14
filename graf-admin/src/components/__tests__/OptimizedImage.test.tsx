/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

afterEach(() => cleanup());

describe('OptimizedImage', () => {
  it('uses the first valid url from an array', () => {
    render(<OptimizedImage src={['', ' /images/sample.png ']} alt="sample" />);

    const image = screen.getByAltText('sample') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('/images/sample.png');
  });

  it('falls back to the store logo on error', async () => {
    render(<OptimizedImage src="/bad.png" alt="store" fallbackType="store" />);

    const image = screen.getByAltText('store') as HTMLImageElement;
    fireEvent.error(image);

    await waitFor(() => {
      expect(image.getAttribute('src')).toBe('/images/logo.svg');
    });
  });

  it('falls back to the default image on error', async () => {
    render(<OptimizedImage src="/bad.png" alt="default" />);

    const image = screen.getByAltText('default') as HTMLImageElement;
    fireEvent.error(image);

    await waitFor(() => {
      expect(image.getAttribute('src')).toBe('/images/no-image.png');
    });
  });
});
