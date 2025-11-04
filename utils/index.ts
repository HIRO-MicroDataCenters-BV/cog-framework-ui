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

/**
 * Generate unique name with number suffix based on existing names
 * @param existingNames - Array of existing names
 * @returns Unique name with number suffix (e.g., "Component_1", "Component_2")
 */
export function generateUniqueName(existingNames: string[]): string {
  if (existingNames.length === 0) {
    return 'Name_1';
  }

  // Find the base name from existing names with number patterns
  const numberPattern = /^(.*)_(\d+)$/;
  const baseNames = new Map<string, number[]>();

  for (const name of existingNames) {
    const match = name.match(numberPattern);
    if (match) {
      const baseName = match[1];
      const number = parseInt(match[2], 10);

      if (!baseNames.has(baseName)) {
        baseNames.set(baseName, []);
      }
      baseNames.get(baseName)!.push(number);
    } else {
      // Name without number suffix
      if (!baseNames.has(name)) {
        baseNames.set(name, []);
      }
    }
  }

  // Find the most common base name or use the first one
  let mostCommonBase = '';
  let maxCount = 0;

  for (const [baseName, numbers] of baseNames) {
    const totalCount =
      numbers.length + (existingNames.includes(baseName) ? 1 : 0);
    if (totalCount > maxCount) {
      maxCount = totalCount;
      mostCommonBase = baseName;
    }
  }

  // If no pattern found, use the first name as base
  if (!mostCommonBase && existingNames.length > 0) {
    mostCommonBase = existingNames[0];
  }

  // Find the next available number
  const existingNumbers = baseNames.get(mostCommonBase) || [];
  let counter = 1;
  while (existingNumbers.includes(counter)) {
    counter++;
  }

  return `${mostCommonBase}_${counter}`;
}

/**
 * Mapping for numeric values to data types
 */
export const DATA_TYPE_MAPPING = {
  file: [0],
  database: [1],
  stream: [10, 11],
  time_series: [20],
} as const;

export type DataTypeName = keyof typeof DATA_TYPE_MAPPING;

/**
 * Get data type name from numeric value
 * @param value - Numeric value representing the data type
 * @returns Data type name (e.g., 'file', 'database', 'stream', 'time_series') or null if not found
 *
 * @example
 * ```typescript
 * getDataTypeFromValue(0) // returns 'file'
 * getDataTypeFromValue(10) // returns 'stream'
 * getDataTypeFromValue(99) // returns null
 * ```
 */
export function getDataTypeFromValue(value: number): DataTypeName | null {
  for (const [type, values] of Object.entries(DATA_TYPE_MAPPING)) {
    if ((values as readonly number[]).includes(value)) {
      return type as DataTypeName;
    }
  }
  return null;
}
