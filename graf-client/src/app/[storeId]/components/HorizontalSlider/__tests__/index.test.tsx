/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

vi.mock('react-bootstrap', () => ({
  Button: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

vi.mock('react-icons/fa', () => ({
  FaChevronLeft: () => <span data-testid="left-arrow">←</span>,
  FaChevronRight: () => <span data-testid="right-arrow">→</span>,
}));

vi.mock('./styles.scss', () => ({}));

import HorizontalSlider from '../index';

describe('HorizontalSlider', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('renders children', async () => {
    await act(async () => {
      root.render(
        <HorizontalSlider>
          <div data-testid="item">Item 1</div>
          <div data-testid="item">Item 2</div>
        </HorizontalSlider>
      );
    });
    expect(container.querySelectorAll('[data-testid="item"]').length).toBe(2);
  });

  it('renders navigation arrows', async () => {
    await act(async () => {
      root.render(
        <HorizontalSlider>
          <div>Item</div>
        </HorizontalSlider>
      );
    });
    expect(container.querySelector('[data-testid="left-arrow"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="right-arrow"]')).toBeTruthy();
  });

  it('accepts custom itemWidth and gap', async () => {
    await act(async () => {
      root.render(
        <HorizontalSlider itemWidth={300} gap={20}>
          <div>Item</div>
        </HorizontalSlider>
      );
    });
    expect(container.innerHTML).toContain('horizontal-slider');
  });

  it('shows loading component when isLoading', async () => {
    await act(async () => {
      root.render(
        <HorizontalSlider isLoading={true}>
          <div>Item</div>
        </HorizontalSlider>
      );
    });
    expect(container.innerHTML).toContain('spinner');
  });

  it('accepts custom loading component', async () => {
    await act(async () => {
      root.render(
        <HorizontalSlider isLoading={true} loadingComponent={<div data-testid="custom-loader">Loading...</div>}>
          <div>Item</div>
        </HorizontalSlider>
      );
    });
    expect(container.querySelector('[data-testid="custom-loader"]')).toBeTruthy();
  });

  it('accepts className prop', async () => {
    await act(async () => {
      root.render(
        <HorizontalSlider className="custom-class">
          <div>Item</div>
        </HorizontalSlider>
      );
    });
    expect(container.innerHTML).toContain('custom-class');
  });

  it('renders with hasMoreItems', async () => {
    const loadMore = vi.fn();
    await act(async () => {
      root.render(
        <HorizontalSlider hasMoreItems={true} loadMoreItems={loadMore}>
          <div>Item</div>
        </HorizontalSlider>
      );
    });
    expect(container.innerHTML).toContain('horizontal-slider');
  });
});
