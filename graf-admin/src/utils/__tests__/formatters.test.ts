import { describe, expect, it, vi } from 'vitest';

import { formatNumberWithCommas, parseEsNumber } from '../formatters';

describe('formatNumberWithCommas', () => {
  it('formats numbers with dot thousands and comma decimals', () => {
    expect(formatNumberWithCommas(13000.5, 2)).toBe('13.000,50');
  });

  it('parses es-CO formatted strings', () => {
    expect(formatNumberWithCommas('13.500,75', 2)).toBe('13.500,75');
  });

  it('parses dot thousand grouping strings', () => {
    expect(formatNumberWithCommas('1.234.567')).toBe('1.234.567');
  });

  it('parses plain numeric strings with dot decimals', () => {
    expect(formatNumberWithCommas('240000.00')).toBe('240.000');
  });

  it('returns 0 for invalid input', () => {
    expect(formatNumberWithCommas('abc')).toBe('0');
  });

  it('handles undefined input', () => {
    expect(formatNumberWithCommas(undefined as unknown as number | string)).toBe('0');
  });

  it('handles NaN input', () => {
    expect(formatNumberWithCommas(NaN)).toBe('0');
  });
});

describe('parseEsNumber', () => {
  it('parses es-CO decimal strings', () => {
    expect(parseEsNumber('13.500,75')).toBe(13500.75);
  });

  it('parses dot thousand grouping', () => {
    expect(parseEsNumber('240.000')).toBe(240000);
  });

  it('parses dot decimals', () => {
    expect(parseEsNumber('240000.50')).toBe(240000.5);
  });

  it('returns NaN for empty input', () => {
    expect(Number.isNaN(parseEsNumber(''))).toBe(true);
  });

  it('parses plain integers without separators', () => {
    expect(parseEsNumber('42')).toBe(42);
  });

  it('returns NaN for invalid comma-formatted strings', () => {
    expect(Number.isNaN(parseEsNumber('abc,def'))).toBe(true);
  });

  it('returns NaN for invalid dot-grouped strings', () => {
    const parseIntSpy = vi.spyOn(globalThis, 'parseInt').mockReturnValueOnce(NaN);
    expect(Number.isNaN(parseEsNumber('123.456'))).toBe(true);
    parseIntSpy.mockRestore();
  });

  it('returns NaN for invalid dot decimals', () => {
    expect(Number.isNaN(parseEsNumber('abc.def'))).toBe(true);
  });

  it('returns NaN for invalid plain strings', () => {
    expect(Number.isNaN(parseEsNumber('abc'))).toBe(true);
  });
});
