import { describe, it, expect } from 'vitest';
import {
  isTrainingJobInFlight,
  trainingJobStateClass,
} from '~/utils/trainingJobStates';

describe('isTrainingJobInFlight', () => {
  it.each(['created', 'running', 'restarting', 'RUNNING'])(
    'treats %s as in flight',
    (state) => {
      expect(isTrainingJobInFlight(state)).toBe(true);
    },
  );

  it.each(['succeeded', 'failed', 'unknown', 'SUCCEEDED'])(
    'treats %s as settled',
    (state) => {
      expect(isTrainingJobInFlight(state)).toBe(false);
    },
  );

  it('treats an absent or unrecognised state as in flight', () => {
    expect(isTrainingJobInFlight(undefined)).toBe(true);
    expect(isTrainingJobInFlight(null)).toBe(true);
    expect(isTrainingJobInFlight('')).toBe(true);
    expect(isTrainingJobInFlight('paused')).toBe(true);
  });
});

describe('trainingJobStateClass', () => {
  it('maps the known states to distinct palettes', () => {
    const classes = [
      'succeeded',
      'running',
      'failed',
      'created',
      'unknown',
    ].map(trainingJobStateClass);
    expect(new Set(classes).size).toBe(classes.length);
    expect(trainingJobStateClass('succeeded')).toContain('green');
    expect(trainingJobStateClass('failed')).toContain('red');
  });

  it('falls back to the muted palette for anything else', () => {
    expect(trainingJobStateClass('weird')).toBe(
      'bg-muted text-muted-foreground',
    );
    expect(trainingJobStateClass(undefined)).toBe(
      'bg-muted text-muted-foreground',
    );
  });
});
