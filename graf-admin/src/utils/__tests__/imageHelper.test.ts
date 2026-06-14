import { describe, expect, it } from 'vitest';

import { extractFirstValidImageUrl, getValidImageUrl } from '../imageHelper';

const DEFAULT_IMAGE = '/images/no-image.png';

describe('imageHelper', () => {
  it('returns the default image for empty values', () => {
    expect(getValidImageUrl(undefined)).toBe(DEFAULT_IMAGE);
    expect(getValidImageUrl(null)).toBe(DEFAULT_IMAGE);
    expect(getValidImageUrl('')).toBe(DEFAULT_IMAGE);
    expect(getValidImageUrl('   ')).toBe(DEFAULT_IMAGE);
  });

  it('trims and returns valid urls', () => {
    expect(getValidImageUrl('  /images/item.png  ')).toBe('/images/item.png');
  });

  it('extracts from string input', () => {
    expect(extractFirstValidImageUrl('/images/item.png')).toBe('/images/item.png');
  });

  it('extracts the first valid url from an array', () => {
    expect(extractFirstValidImageUrl(['', '   ', '/images/item.png'])).toBe('/images/item.png');
  });

  it('returns default when no valid urls are found', () => {
    expect(extractFirstValidImageUrl(['', '   '])).toBe(DEFAULT_IMAGE);
  });

  it('returns default when images are missing', () => {
    expect(extractFirstValidImageUrl(undefined)).toBe(DEFAULT_IMAGE);
  });
});
