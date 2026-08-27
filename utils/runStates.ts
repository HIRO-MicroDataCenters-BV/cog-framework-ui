/**
 * Run states that will never change again.
 *
 * Both spellings of cancelled are listed on purpose. KFP v2beta1 reports
 * `CANCELED`, but the app treats `CANCELLED` as the same state wherever it
 * renders one (the runs list status cell, `PipelineRunSheet`), so a run
 * arriving with the double-L spelling must settle here too — otherwise the
 * pages that poll would read it as unfinished and never stop.
 */
const TERMINAL_RUN_STATES = new Set([
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
  'CANCELLED',
  'SKIPPED',
]);

/**
 * Whether a run can still change server-side, and is therefore worth polling.
 *
 * Anything that is not a settled state counts as in flight — `PENDING`,
 * `RUNNING`, `CANCELING`, `PAUSED`, and also an absent or unrecognised state,
 * so an unexpected value shows live updates rather than silently freezing.
 *
 * @param state Run state as reported by KFP; case-insensitive.
 */
export const isRunStateInFlight = (state?: string | null): boolean =>
  !TERMINAL_RUN_STATES.has(String(state ?? '').toUpperCase());
