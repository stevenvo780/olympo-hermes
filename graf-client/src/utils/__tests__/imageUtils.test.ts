/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  getValidImageUrl,
  extractFirstValidImageUrl,
  validateFirebaseUrl,
  extractImageUrl,
  getImageFallback,
} from '../imageUtils';

const DEFAULT_IMAGE = '/images/no-image.png';

describe('imageUtils', () => {
  describe('getValidImageUrl', () => {
    it('returns default for undefined', () => {
      expect(getValidImageUrl(undefined)).toBe(DEFAULT_IMAGE);
    });

    it('returns default for null', () => {
      expect(getValidImageUrl(null)).toBe(DEFAULT_IMAGE);
    });

    it('returns default for empty string', () => {
      expect(getValidImageUrl('')).toBe(DEFAULT_IMAGE);
      expect(getValidImageUrl('   ')).toBe(DEFAULT_IMAGE);
    });

    it('returns trimmed URL for valid string', () => {
      expect(getValidImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
      expect(getValidImageUrl('  https://example.com/image.jpg  ')).toBe('https://example.com/image.jpg');
    });

    it('returns default for non-string value', () => {
      expect(getValidImageUrl(123 as any)).toBe(DEFAULT_IMAGE);
    });
  });

  describe('extractFirstValidImageUrl', () => {
    it('returns default for undefined', () => {
      expect(extractFirstValidImageUrl(undefined)).toBe(DEFAULT_IMAGE);
    });

    it('returns default for null', () => {
      expect(extractFirstValidImageUrl(null)).toBe(DEFAULT_IMAGE);
    });

    it('handles string input', () => {
      expect(extractFirstValidImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
    });

    it('returns first valid URL from array', () => {
      const images = ['https://example.com/1.jpg', 'https://example.com/2.jpg'];
      expect(extractFirstValidImageUrl(images)).toBe('https://example.com/1.jpg');
    });

    it('skips empty strings in array', () => {
      const images = ['', '   ', 'https://example.com/valid.jpg'];
      expect(extractFirstValidImageUrl(images)).toBe('https://example.com/valid.jpg');
    });

    it('returns default for array of empty strings', () => {
      expect(extractFirstValidImageUrl(['', ''])).toBe(DEFAULT_IMAGE);
    });

    it('returns default for empty array', () => {
      expect(extractFirstValidImageUrl([])).toBe(DEFAULT_IMAGE);
    });

    it('returns default for non-string non-array input', () => {
      expect(extractFirstValidImageUrl({} as any)).toBe(DEFAULT_IMAGE);
    });
  });

  describe('validateFirebaseUrl', () => {
    it('is alias for getValidImageUrl', () => {
      expect(validateFirebaseUrl).toBe(getValidImageUrl);
      expect(validateFirebaseUrl('https://test.com')).toBe('https://test.com');
    });
  });

  describe('extractImageUrl', () => {
    it('is alias for extractFirstValidImageUrl', () => {
      expect(extractImageUrl).toBe(extractFirstValidImageUrl);
      expect(extractImageUrl(['https://test.com'])).toBe('https://test.com');
    });
  });

  describe('getImageFallback', () => {
    it('returns logo for store type', () => {
      expect(getImageFallback('store')).toBe('/images/logo.svg');
    });

    it('returns default for product type', () => {
      expect(getImageFallback('product')).toBe(DEFAULT_IMAGE);
    });

    it('returns default for category type', () => {
      expect(getImageFallback('category')).toBe(DEFAULT_IMAGE);
    });

    it('returns default for general type', () => {
      expect(getImageFallback('general')).toBe(DEFAULT_IMAGE);
    });

    it('returns default when no type provided', () => {
      expect(getImageFallback()).toBe(DEFAULT_IMAGE);
    });
  });
});
