/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';

// Mock next/script
vi.mock('next/script', () => ({
  default: ({ children }: { children?: string }) => children ?? null,
}));

// Mock ClientLayout
vi.mock('../components/ClientLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

import React from 'react';
import RootLayout, { metadata } from '../layout';

describe('graf/layout', () => {
  it('exports metadata with correct title', () => {
    expect(metadata.title).toBeDefined();
    expect(metadata.title.default).toBe('Graf');
  });

  it('exports metadata with description', () => {
    expect(metadata.description).toContain('Graf');
  });

  it('exports openGraph metadata', () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph.title).toBe('Graf');
  });

  it('exports twitter metadata', () => {
    expect(metadata.twitter).toBeDefined();
    expect(metadata.twitter.card).toBe('summary_large_image');
  });

  it('RootLayout renders children', async () => {
    const result = await RootLayout({ children: <div>Test</div> });
    expect(result).toBeDefined();
  });
});
