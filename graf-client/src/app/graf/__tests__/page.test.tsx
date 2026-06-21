/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';

// Mock ClientHome
vi.mock('../home/ClientHome', () => ({
  default: () => null,
}));

import HomePage, { metadata, dynamic } from '../page';

describe('hermes/page', () => {
  it('exports dynamic as force-dynamic', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('exports metadata with correct title', () => {
    expect(metadata.title).toBe('Hermes');
  });

  it('exports metadata with description', () => {
    expect(metadata.description).toContain('Hermes');
  });

  it('exports metadata with keywords', () => {
    expect(metadata.keywords).toContain('ecommerce');
  });

  it('exports openGraph metadata', () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph?.title).toBe('Hermes');
  });

  it('exports twitter metadata', () => {
    expect(metadata.twitter).toBeDefined();
    expect((metadata.twitter as any)?.card).toBe('summary_large_image');
  });

  it('exports robots metadata', () => {
    expect(metadata.robots).toBeDefined();
  });

  it('HomePage component rendered', async () => {
    const result = await HomePage();
    expect(result).toBeDefined();
  });
});
