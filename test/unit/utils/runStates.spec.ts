import { describe, it, expect } from 'vitest';
import { isRunStateInFlight } from '~/utils/runStates';

describe('isRunStateInFlight', () => {
  it.each(['SUCCEEDED', 'FAILED', 'CANCELED', 'SKIPPED'])(
    'treats %s as settled',
    (state) => {
      expect(isRunStateInFlight(state)).toBe(false);
    },
  );

  // KFP reports CANCELED, but the app renders CANCELLED in places; a run on the
  // double-L spelling must still settle or the polling pages never stop.
  it('treats both spellings of cancelled as settled', () => {
    expect(isRunStateInFlight('CANCELED')).toBe(false);
    expect(isRunStateInFlight('CANCELLED')).toBe(false);
  });

  it.each(['PENDING', 'RUNNING', 'CANCELING', 'PAUSED'])(
    'treats %s as in flight',
    (state) => {
      expect(isRunStateInFlight(state)).toBe(true);
    },
  );

  it('is case-insensitive', () => {
    expect(isRunStateInFlight('succeeded')).toBe(false);
    expect(isRunStateInFlight('Cancelled')).toBe(false);
    expect(isRunStateInFlight('running')).toBe(true);
  });

  // An unknown state showing live updates beats one that silently freezes.
  it.each([undefined, null, '', 'RUNTIME_STATE_UNSPECIFIED', 'WAT'])(
    'treats %s as in flight',
    (state) => {
      expect(isRunStateInFlight(state)).toBe(true);
    },
  );
});
