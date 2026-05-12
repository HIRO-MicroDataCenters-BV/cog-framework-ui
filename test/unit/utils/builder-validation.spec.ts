import { describe, it, expect } from 'vitest';
import { validateConstant } from '~/utils/builder-validation';

describe('validateConstant', () => {
  describe('empty source', () => {
    it('returns constant_required for empty or whitespace-only input regardless of type', () => {
      expect(validateConstant('', 'int')).toBe(
        'validation.input.constant_required',
      );
      expect(validateConstant('   ', 'float')).toBe(
        'validation.input.constant_required',
      );
      expect(validateConstant('', 'string')).toBe(
        'validation.input.constant_required',
      );
      expect(validateConstant('', 'boolean')).toBe(
        'validation.input.constant_required',
      );
    });
  });

  describe('integer / int', () => {
    it('accepts whole numbers (positive, negative, zero)', () => {
      expect(validateConstant('42', 'int')).toBeNull();
      expect(validateConstant('42', 'integer')).toBeNull();
      expect(validateConstant('-5', 'int')).toBeNull();
      expect(validateConstant('0', 'int')).toBeNull();
      expect(validateConstant('1000000', 'Integer')).toBeNull();
    });

    it('rejects decimal values (the original bug — 8.2 in an int field)', () => {
      expect(validateConstant('8.2', 'int')).toBe(
        'validation.input.constant_integer',
      );
      expect(validateConstant('5.0', 'integer')).toBe(
        'validation.input.constant_integer',
      );
      expect(validateConstant('-0.001', 'int')).toBe(
        'validation.input.constant_integer',
      );
    });

    it('rejects non-numeric input', () => {
      expect(validateConstant('abc', 'int')).toBe(
        'validation.input.constant_integer',
      );
      expect(validateConstant('1e5', 'int')).toBe(
        'validation.input.constant_integer',
      );
      expect(validateConstant('+5', 'int')).toBe(
        'validation.input.constant_integer',
      );
    });
  });

  describe('float / double / number', () => {
    it('accepts both whole numbers and decimals', () => {
      expect(validateConstant('42', 'float')).toBeNull();
      expect(validateConstant('8.2', 'float')).toBeNull();
      expect(validateConstant('-0.001', 'double')).toBeNull();
      expect(validateConstant('0', 'number')).toBeNull();
      expect(validateConstant('0.001', 'Float')).toBeNull();
    });

    it('rejects malformed numbers', () => {
      expect(validateConstant('abc', 'float')).toBe(
        'validation.input.constant_float',
      );
      expect(validateConstant('1.', 'float')).toBe(
        'validation.input.constant_float',
      );
      expect(validateConstant('.5', 'float')).toBe(
        'validation.input.constant_float',
      );
      expect(validateConstant('1.2.3', 'double')).toBe(
        'validation.input.constant_float',
      );
    });
  });

  describe('boolean / bool', () => {
    it('accepts true/false (any case) and 0/1', () => {
      expect(validateConstant('true', 'boolean')).toBeNull();
      expect(validateConstant('false', 'bool')).toBeNull();
      expect(validateConstant('TRUE', 'boolean')).toBeNull();
      expect(validateConstant('False', 'bool')).toBeNull();
      expect(validateConstant('0', 'boolean')).toBeNull();
      expect(validateConstant('1', 'bool')).toBeNull();
    });

    it('rejects other strings', () => {
      expect(validateConstant('yes', 'boolean')).toBe(
        'validation.input.constant_boolean',
      );
      expect(validateConstant('no', 'bool')).toBe(
        'validation.input.constant_boolean',
      );
      expect(validateConstant('2', 'boolean')).toBe(
        'validation.input.constant_boolean',
      );
    });
  });

  describe('unknown / passthrough types', () => {
    it('accepts any non-empty value for types without a dedicated rule', () => {
      expect(validateConstant('anything goes', 'string')).toBeNull();
      expect(validateConstant('foo.csv', 'CSV')).toBeNull();
      expect(validateConstant('whatever', 'parquet')).toBeNull();
    });
  });
});
