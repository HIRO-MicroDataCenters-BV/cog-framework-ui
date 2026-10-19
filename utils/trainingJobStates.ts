/**
 * Training-job states (`GET /cogapi/training-jobs`) that will never change
 * again. `unknown` is terminal too: the backend sets it when the Kubernetes
 * resource disappeared before a terminal condition was recorded, and nothing
 * can move it afterwards.
 */
const TERMINAL_TRAINING_JOB_STATES = new Set([
  'succeeded',
  'failed',
  'unknown',
]);

/**
 * Whether a training job can still change server-side, and is therefore
 * worth polling. Anything not settled (`created`, `running`, `restarting`,
 * an absent or unrecognised state) counts as in flight.
 *
 * @param state Job state as reported by CogAPI; case-insensitive.
 */
export const isTrainingJobInFlight = (state?: string | null): boolean =>
  !TERMINAL_TRAINING_JOB_STATES.has(String(state ?? '').toLowerCase());

/** Badge colour class per state (same palette as the pipeline-runs page). */
export const trainingJobStateClass = (state?: string | null): string => {
  const key = String(state ?? '').toLowerCase();
  const classes: Record<string, string> = {
    succeeded:
      'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100',
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100',
    restarting:
      'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-100',
    failed: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100',
    created:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100',
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100',
  };
  return classes[key] || 'bg-muted text-muted-foreground';
};
