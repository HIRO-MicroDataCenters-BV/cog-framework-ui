import type { Updater } from '@tanstack/vue-table';
import type { Ref } from 'vue';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function valueUpdater<T extends Updater<unknown>>(
  updaterOrValue: T,
  ref: Ref,
) {
  ref.value =
    typeof updaterOrValue === 'function'
      ? updaterOrValue(ref.value)
      : updaterOrValue;
}

/**
 * Calculate duration between two dates
 * @param startDate - Start date (ISO string, Date, or unix timestamp)
 * @param endDate - End date (ISO string, Date, or unix timestamp), defaults to current time
 * @returns Formatted duration string (e.g., "2h 30m", "45s", "1d 3h")
 */
export function calculateDuration(
  startDate?: string | Date | number,
  endDate?: string | Date | number,
): string {
  if (!startDate) return '-';

  const start =
    typeof startDate === 'number'
      ? new Date(startDate * 1000)
      : new Date(startDate);
  const end = endDate
    ? typeof endDate === 'number'
      ? new Date(endDate * 1000)
      : new Date(endDate)
    : new Date();

  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) return '-';

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remainingHours = diffHours % 24;
    return remainingHours > 0
      ? `${diffDays}d ${remainingHours}h`
      : `${diffDays}d`;
  }

  if (diffHours > 0) {
    const remainingMinutes = diffMinutes % 60;
    return remainingMinutes > 0
      ? `${diffHours}h ${remainingMinutes}m`
      : `${diffHours}h`;
  }

  if (diffMinutes > 0) {
    return `${diffMinutes}m`;
  }

  return `${diffSeconds}s`;
}
