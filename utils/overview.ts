/**
 * Formatting helpers for the Overview home page.
 */

/** 0-1 ratio → whole percent; null stays null. */
export const toPercent = (ratio: number | null | undefined): number | null =>
  ratio === null || ratio === undefined ? null : Math.round(ratio * 100);

/** Coarse "x ago" for a timestamp, relative to `now`. */
export const timeAgo = (
  iso: string | null | undefined,
  now: number = Date.now(),
): string => {
  if (!iso) return '';
  const minutes = Math.max(
    0,
    Math.round((now - new Date(iso).getTime()) / 60000),
  );
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

/** Pill colours for a run or endpoint status. */
export const statusPillClass = (status: string | null | undefined): string => {
  switch ((status || '').toUpperCase()) {
    case 'SUCCEEDED':
    case 'READY':
      return 'bg-green-500/15 text-green-600 dark:text-green-400';
    case 'FAILED':
    case 'ERROR':
      return 'bg-red-500/15 text-red-600 dark:text-red-400';
    case 'RUNNING':
    case 'PENDING':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const plural = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? '' : 's'}`;
