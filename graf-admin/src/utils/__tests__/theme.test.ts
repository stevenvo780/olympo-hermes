import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyPalette, getTextColorForBackground, resetPalette } from '../theme';

const hadDocument = Object.prototype.hasOwnProperty.call(globalThis, 'document');
const originalDocument = globalThis.document;

let setProperty: ReturnType<typeof vi.fn>;
let removeAttribute: ReturnType<typeof vi.fn>;

beforeEach(() => {
  setProperty = vi.fn();
  removeAttribute = vi.fn();
  (globalThis as { document?: Document }).document = {
    documentElement: {
      style: { setProperty },
      removeAttribute,
    },
  } as unknown as Document;
});

afterEach(() => {
  if (hadDocument) {
    globalThis.document = originalDocument as Document;
  } else {
    delete (globalThis as { document?: Document }).document;
  }
  vi.restoreAllMocks();
});

describe('theme utils', () => {
  it('applies palette variables to the document', () => {
    applyPalette({
      '--primary-color': '#ffffff',
      '--secondary-color': '#000000',
    });

    expect(setProperty).toHaveBeenCalledWith('--primary-color', '#ffffff');
    expect(setProperty).toHaveBeenCalledWith('--secondary-color', '#000000');
  });

  it('returns dark text for warning-like backgrounds', () => {
    expect(getTextColorForBackground('warning')).toBe('var(--dark-color)');
    expect(getTextColorForBackground('#ffc107')).toBe('var(--dark-color)');
    expect(getTextColorForBackground('#ffca2c')).toBe('var(--dark-color)');
  });

  it('returns white text for other backgrounds', () => {
    expect(getTextColorForBackground('#123456')).toBe('var(--white-color)');
  });

  it('clears inline palette styles', () => {
    resetPalette();
    expect(removeAttribute).toHaveBeenCalledWith('style');
  });
});
