/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { formatNumberWithCommas } from '../formatters';

describe('formatters', () => {
  describe('formatNumberWithCommas', () => {
    it('formats integer numbers with commas', () => {
      expect(formatNumberWithCommas(1000)).toBe('1,000');
      expect(formatNumberWithCommas(1000000)).toBe('1,000,000');
    });

    it('handles small numbers without commas', () => {
      expect(formatNumberWithCommas(100)).toBe('100');
      expect(formatNumberWithCommas(0)).toBe('0');
    });

    it('handles decimals parameter', () => {
      expect(formatNumberWithCommas(1234.5678, 2)).toBe('1,234.57');
      expect(formatNumberWithCommas(1000, 2)).toBe('1,000.00');
    });

    it('parses string input', () => {
      expect(formatNumberWithCommas('1000')).toBe('1,000');
      expect(formatNumberWithCommas('$1,000.50')).toBe('1,001');
    });

    it('handles invalid string input', () => {
      expect(formatNumberWithCommas('abc')).toBe('0');
      expect(formatNumberWithCommas('')).toBe('0');
    });

    it('handles negative numbers', () => {
      expect(formatNumberWithCommas(-1000)).toBe('-1,000');
      expect(formatNumberWithCommas(-1234.56, 2)).toBe('-1,234.56');
    });

    it('returns 0 for NaN results', () => {
      expect(formatNumberWithCommas(NaN)).toBe('0');
    });

    it('uses default decimals of 0', () => {
      expect(formatNumberWithCommas(1234.99)).toBe('1,235');
    });
  });
});
