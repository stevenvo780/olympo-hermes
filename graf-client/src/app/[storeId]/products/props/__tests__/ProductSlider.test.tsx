/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ProductSlider from '../ProductSlider';

// Mock Swiper
vi.mock('swiper/react', () => ({
  Swiper: ({ children, ...props }: any) => <div data-testid="swiper" {...props}>{children}</div>,
  SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>,
}));

vi.mock('swiper/modules', () => ({
  Autoplay: {},
  Pagination: {},
  Navigation: {}
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <span data-testid="next-image" data-src={src} data-alt={alt} {...props} />
  )
}));

describe('ProductSlider', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing if banners array is empty', () => {
    const { container } = render(<ProductSlider banners={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders slider with images', () => {
    const banners = ['/img1.jpg', '/img2.jpg'];
    render(<ProductSlider banners={banners} />);

    expect(screen.getByTestId('swiper')).toBeTruthy();
    expect(screen.getAllByTestId('swiper-slide')).toHaveLength(2);
    const images = screen.getAllByTestId('next-image');
    expect(images[0]?.getAttribute('data-alt')).toBe('Banner 1');
  });

  it('adjusts height based on window width', () => {
    // Initial: defaults to desktop (window.innerWidth usually 1024 or similar in jsdom)
    // We can simulate resize
    const banners = ['/img1.jpg'];
    render(<ProductSlider banners={banners} />);

    // Check initial (likely desktop or the default state before resize)
    // The component sets state in useEffect based on window size.

    // Helper to resize
    const resizeWindow = (width: number) => {
      global.innerWidth = width;
      fireEvent(window, new Event('resize'));
    };

    act(() => {
      resizeWindow(500); // Mobile
    });
    // In our mock, we are just rendering divs. The height is applied to the div wrapping the image.
    // We need to inspect the inline style of the div inside SwiperSlide

    // Re-query
    let container = screen.getByTestId('swiper-slide').firstChild as HTMLElement;
    expect(container.style.height).toBe('180px'); // Mobile height

    act(() => {
      resizeWindow(800); // Tablet
    });
    container = screen.getByTestId('swiper-slide').firstChild as HTMLElement;
    expect(container.style.height).toBe('250px');

    act(() => {
      resizeWindow(1200); // Desktop
    });
    container = screen.getByTestId('swiper-slide').firstChild as HTMLElement;
    expect(container.style.height).toBe('300px');

    act(() => {
      resizeWindow(1600); // Large Desktop
    });
    container = screen.getByTestId('swiper-slide').firstChild as HTMLElement;
    expect(container.style.height).toBe('500px');
  });
});
