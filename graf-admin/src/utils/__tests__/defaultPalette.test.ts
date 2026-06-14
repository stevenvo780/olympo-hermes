import { describe, expect, it } from 'vitest';

import { defaultPalette } from '../defaultPalette';

describe('defaultPalette', () => {
  it('includes core palette tokens', () => {
    expect(defaultPalette['--primary-color']).toBe('#1B3862');
    expect(defaultPalette['--secondary-color']).toBe('#06817E');
    expect(defaultPalette['--danger-color']).toBe('#D84654');
  });

  it('uses css variable keys', () => {
    const keys = Object.keys(defaultPalette);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((key) => key.startsWith('--'))).toBe(true);
  });
});
