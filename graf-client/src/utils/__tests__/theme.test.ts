/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyPalette, resetPalette } from '../theme';

describe('theme', () => {
  beforeEach(() => {
    // Reset document element style before each test
    document.documentElement.removeAttribute('style');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('style');
  });

  describe('applyPalette', () => {
    it('applies single CSS variable', () => {
      applyPalette({ '--primary-color': '#ff0000' });
      expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#ff0000');
    });

    it('applies multiple CSS variables', () => {
      applyPalette({
        '--primary-color': '#ff0000',
        '--secondary-color': '#00ff00',
        '--bg-color': '#0000ff',
      });
      expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#ff0000');
      expect(document.documentElement.style.getPropertyValue('--secondary-color')).toBe('#00ff00');
      expect(document.documentElement.style.getPropertyValue('--bg-color')).toBe('#0000ff');
    });

    it('handles empty palette', () => {
      applyPalette({});
      expect(document.documentElement.getAttribute('style')).toBeFalsy();
    });
  });

  describe('resetPalette', () => {
    it('removes style attribute from document element', () => {
      document.documentElement.style.setProperty('--test-color', '#123456');
      expect(document.documentElement.getAttribute('style')).toBeTruthy();

      resetPalette();
      expect(document.documentElement.getAttribute('style')).toBeFalsy();
    });

    it('works when no styles are applied', () => {
      resetPalette();
      expect(document.documentElement.getAttribute('style')).toBeFalsy();
    });
  });
});
