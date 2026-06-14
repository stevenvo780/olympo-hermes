import { numericTransformer } from './numeric.transformer';

describe('NumericTransformer', () => {
  describe('to', () => {
    it('should return null when value is null', () => {
      expect(numericTransformer.to(null)).toBeNull();
    });

    it('should return the number when value is a number', () => {
      expect(numericTransformer.to(123.45)).toBe(123.45);
    });
  });

  describe('from', () => {
    it('should return null when value is null', () => {
      expect(numericTransformer.from(null)).toBeNull();
    });

    it('should return null when value is undefined', () => {
      expect(numericTransformer.from(undefined)).toBeNull();
    });

    it('should return the number when value is a number', () => {
      expect(numericTransformer.from(123.45)).toBe(123.45);
    });

    it('should return parsed number when value is a string number', () => {
      expect(numericTransformer.from('123.45')).toBe(123.45);
    });

    it('should return null when value is a non-numeric string', () => {
      expect(numericTransformer.from('abc')).toBeNull();
    });

    it('should return integer when value is an integer string', () => {
      expect(numericTransformer.from('10')).toBe(10);
    });
  });
});
