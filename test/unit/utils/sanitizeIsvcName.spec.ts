import { describe, it, expect } from 'vitest';
import { sanitizeIsvcName } from '~/utils/sanitizeIsvcName';

// Mirrors the validation regex used inside the dialog (kept inline there).
// Used here only to assert that sanitizer output is always backend-acceptable.
const ISVC_NAME_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

describe('sanitizeIsvcName', () => {
  it('lowercases alphabetic characters', () => {
    expect(sanitizeIsvcName('FooBar')).toBe('foobar');
    expect(sanitizeIsvcName('MODEL')).toBe('model');
  });

  it('replaces periods with hyphens (the original bug — Qwen2.5 → qwen2-5)', () => {
    expect(sanitizeIsvcName('Qwen2.5-Coder-7B-Instruct')).toBe(
      'qwen2-5-coder-7b-instruct',
    );
    expect(sanitizeIsvcName('Qwen3.6-35B-A3B')).toBe('qwen3-6-35b-a3b');
    expect(sanitizeIsvcName('v1.2.3')).toBe('v1-2-3');
  });

  it('replaces underscores with hyphens', () => {
    expect(sanitizeIsvcName('my_model_name')).toBe('my-model-name');
  });

  it('replaces other invalid characters (slashes, spaces, plus) with hyphens', () => {
    expect(sanitizeIsvcName('org/model name')).toBe('org-model-name');
    expect(sanitizeIsvcName('foo+bar')).toBe('foo-bar');
    expect(sanitizeIsvcName('foo!bar@baz')).toBe('foo-bar-baz');
  });

  it('collapses runs of invalid characters into a single hyphen', () => {
    expect(sanitizeIsvcName('foo...bar')).toBe('foo-bar');
    expect(sanitizeIsvcName('foo___bar')).toBe('foo-bar');
    expect(sanitizeIsvcName('foo   bar')).toBe('foo-bar');
    expect(sanitizeIsvcName('foo._-_.bar')).toBe('foo-bar');
  });

  it('collapses adjacent hyphens', () => {
    expect(sanitizeIsvcName('foo--bar')).toBe('foo-bar');
    expect(sanitizeIsvcName('foo----bar')).toBe('foo-bar');
  });

  it('strips leading and trailing hyphens', () => {
    expect(sanitizeIsvcName('-foo-')).toBe('foo');
    expect(sanitizeIsvcName('---foo---')).toBe('foo');
  });

  it('strips leading and trailing characters that became hyphens', () => {
    expect(sanitizeIsvcName('.foo.')).toBe('foo');
    expect(sanitizeIsvcName('_foo_')).toBe('foo');
    expect(sanitizeIsvcName(' foo ')).toBe('foo');
  });

  it('returns empty string when nothing alphanumeric remains', () => {
    expect(sanitizeIsvcName('')).toBe('');
    expect(sanitizeIsvcName('___')).toBe('');
    expect(sanitizeIsvcName('...')).toBe('');
    expect(sanitizeIsvcName('---')).toBe('');
    expect(sanitizeIsvcName('   ')).toBe('');
  });

  it('preserves already-valid input unchanged', () => {
    expect(sanitizeIsvcName('hp3')).toBe('hp3');
    expect(sanitizeIsvcName('my-model-serving')).toBe('my-model-serving');
    expect(sanitizeIsvcName('a1b2c3')).toBe('a1b2c3');
  });

  it('produces output that always passes ISVC_NAME_REGEX when non-empty', () => {
    const inputs = [
      'Qwen2.5-Coder-7B-Instruct',
      'Qwen3.6-35B-A3B',
      'my_model_v2',
      'MODEL/with spaces',
      'foo+bar.baz_qux',
      'a',
      '0',
      '...weird---name...',
    ];
    for (const input of inputs) {
      const out = sanitizeIsvcName(input);
      if (out !== '') {
        expect(ISVC_NAME_REGEX.test(out)).toBe(true);
      }
    }
  });

  it('matches the dialog flow: sanitized + "-serving" stays valid', () => {
    const cases = [
      ['Qwen2.5-Coder', 'qwen2-5-coder-serving'],
      ['Qwen3.6-35B-A3B', 'qwen3-6-35b-a3b-serving'],
      ['My_Model', 'my-model-serving'],
      ['hp3', 'hp3-serving'],
    ] as const;
    for (const [input, expected] of cases) {
      const out = `${sanitizeIsvcName(input)}-serving`;
      expect(out).toBe(expected);
      expect(ISVC_NAME_REGEX.test(out)).toBe(true);
    }
  });

  it('handles edge case of single-character input', () => {
    expect(sanitizeIsvcName('A')).toBe('a');
    expect(sanitizeIsvcName('5')).toBe('5');
    expect(sanitizeIsvcName('-')).toBe('');
    expect(sanitizeIsvcName('.')).toBe('');
  });
});
