/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

// Mock the stylesheet import
vi.mock('./styles.scss', () => ({}));

// Mock DOMPurify
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((html: string) => html.replace(/<script[^>]*>.*?<\/script>/gi, '')),
  },
}));

// Import after mocks
import SafeHtmlRenderer from '../index';
import DOMPurify from 'isomorphic-dompurify';

describe('SafeHtmlRenderer', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders sanitized HTML', async () => {
    await act(async () => {
      root.render(<SafeHtmlRenderer html="<p>Hello World</p>" />);
    });

    expect(container.textContent).toContain('Hello World');
    expect(DOMPurify.sanitize).toHaveBeenCalled();
  });

  it('applies custom className', async () => {
    await act(async () => {
      root.render(<SafeHtmlRenderer html="<p>Test</p>" className="custom-class" />);
    });

    const wrapper = container.querySelector('.safe-html-content');
    expect(wrapper?.classList.contains('custom-class')).toBe(true);
  });

  it('applies custom styles', async () => {
    await act(async () => {
      root.render(<SafeHtmlRenderer html="<p>Test</p>" style={{ color: 'red' }} />);
    });

    const wrapper = container.querySelector('.safe-html-content') as HTMLElement;
    expect(wrapper?.style.color).toBe('red');
  });

  it('sanitizes script tags', async () => {
    await act(async () => {
      root.render(<SafeHtmlRenderer html="<p>Safe</p><script>alert('xss')</script>" />);
    });

    expect(container.innerHTML).not.toContain('<script>');
    expect(container.textContent).toContain('Safe');
  });
});
