import { describe, it, expect } from 'vitest';
import { plural, statusPillClass, timeAgo, toPercent } from '~/utils/overview';

describe('overview.toPercent', () => {
  it('rounds a ratio to a whole percent and keeps null', () => {
    expect(toPercent(0.9167)).toBe(92);
    expect(toPercent(0)).toBe(0);
    expect(toPercent(null)).toBeNull();
    expect(toPercent(undefined)).toBeNull();
  });
});

describe('overview.timeAgo', () => {
  const now = Date.parse('2026-10-27T12:00:00Z');

  it('uses minutes, hours, then days', () => {
    expect(timeAgo('2026-10-27T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2026-10-27T11:40:00Z', now)).toBe('20 min ago');
    expect(timeAgo('2026-10-27T09:00:00Z', now)).toBe('3h ago');
    expect(timeAgo('2026-10-24T12:00:00Z', now)).toBe('3d ago');
  });

  it('is empty without a timestamp and never negative', () => {
    expect(timeAgo(null, now)).toBe('');
    expect(timeAgo('2026-10-27T12:05:00Z', now)).toBe('just now');
  });
});

describe('overview.statusPillClass', () => {
  it('colours by status, case-insensitively', () => {
    expect(statusPillClass('succeeded')).toContain('green');
    expect(statusPillClass('READY')).toContain('green');
    expect(statusPillClass('FAILED')).toContain('red');
    expect(statusPillClass('Running')).toContain('amber');
    expect(statusPillClass(null)).toContain('muted');
  });
});

describe('overview.plural', () => {
  it('adds an s except for one', () => {
    expect(plural(1, 'failure')).toBe('1 failure');
    expect(plural(3, 'failure')).toBe('3 failures');
    expect(plural(0, 'endpoint')).toBe('0 endpoints');
  });
});
