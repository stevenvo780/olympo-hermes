/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { defaultPalette } from '../defaultPalette';

describe('defaultPalette', () => {
  it('is an object', () => {
    expect(typeof defaultPalette).toBe('object');
  });

  it('has required color variables', () => {
    expect(defaultPalette['--primary-color']).toBeDefined();
    expect(defaultPalette['--secondary-color']).toBeDefined();
    expect(defaultPalette['--bg-color']).toBeDefined();
    expect(defaultPalette['--font-color']).toBeDefined();
  });

  it('has navbar colors', () => {
    expect(defaultPalette['--navbar-color']).toBeDefined();
    expect(defaultPalette['--navbar-text']).toBeDefined();
  });

  it('has card colors', () => {
    expect(defaultPalette['--card-color']).toBeDefined();
    expect(defaultPalette['--card-text']).toBeDefined();
  });

  it('has button variant colors', () => {
    expect(defaultPalette['--success-color']).toBeDefined();
    expect(defaultPalette['--warning-color']).toBeDefined();
    expect(defaultPalette['--danger-color']).toBeDefined();
    expect(defaultPalette['--info-color']).toBeDefined();
  });

  it('contains valid hex color values', () => {
    const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
    Object.values(defaultPalette).forEach(value => {
      expect(value).toMatch(hexColorPattern);
    });
  });

  it('has quantity styling variables', () => {
    expect(defaultPalette['--quantity-bg']).toBeDefined();
    expect(defaultPalette['--quantity-text']).toBeDefined();
    expect(defaultPalette['--quantity-border']).toBeDefined();
  });
});
