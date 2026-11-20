/**
 * Formatting and parsing for resource quotas.
 *
 * The API reports Kubernetes quantities (`"4"`, `"500m"`, `"16Gi"`) plus a
 * numeric value in cores / bytes / GPUs. These helpers turn those into
 * readable text for the cards and back into quantities for the edit form.
 */

import type { QuotaResourceName } from '~/types/api.types';

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;

const BINARY_SUFFIXES: Record<string, number> = {
  Ki: 1024,
  Mi: MIB,
  Gi: GIB,
  Ti: 1024 ** 4,
  Pi: 1024 ** 5,
  Ei: 1024 ** 6,
};
// Kubernetes spells the decimal kilo as lowercase `k`; `K` is tolerated when
// reading because nothing is gained by failing to display an odd value.
const DECIMAL_SUFFIXES: Record<string, number> = {
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
};

/** Cores from a CPU quantity: `"500m"` → 0.5, `"4"` → 4. NaN when unparsable. */
export const parseCpuQuantity = (value: string | null | undefined): number => {
  if (value == null || value === '') return NaN;
  const text = String(value).trim();
  if (text.endsWith('m')) return Number(text.slice(0, -1)) / 1000;
  return Number(text);
};

/** Bytes from a memory quantity: `"16Gi"` → 17179869184. NaN when unparsable. */
export const parseMemoryQuantity = (
  value: string | null | undefined,
): number => {
  if (value == null || value === '') return NaN;
  const text = String(value).trim();
  for (const [suffix, factor] of Object.entries(BINARY_SUFFIXES)) {
    if (text.endsWith(suffix)) return Number(text.slice(0, -2)) * factor;
  }
  for (const [suffix, factor] of Object.entries(DECIMAL_SUFFIXES)) {
    if (text.endsWith(suffix)) return Number(text.slice(0, -1)) * factor;
  }
  return Number(text);
};

/** Trim a number to at most `digits` decimals without trailing zeros. */
const trim = (value: number, digits = 2): string =>
  Number(value.toFixed(digits)).toString();

/** Cores as text: 0.5 → `"0.5"`, 4 → `"4"`, 1.2599 → `"1.26"`. */
export const formatCpu = (cores: number | null | undefined): string =>
  cores == null || Number.isNaN(cores) ? '–' : trim(cores);

/** Bytes as text in GiB, or MiB below one GiB: `"2.5 GiB"`, `"256 MiB"`. */
export const formatMemory = (bytes: number | null | undefined): string => {
  if (bytes == null || Number.isNaN(bytes)) return '–';
  if (bytes >= GIB) return `${trim(bytes / GIB)} GiB`;
  return `${trim(bytes / MIB, 0)} MiB`;
};

/** GPU count as text. */
export const formatGpu = (count: number | null | undefined): string =>
  count == null || Number.isNaN(count) ? '–' : trim(count, 0);

/** One resource's value as text, by resource kind. */
export const formatQuotaValue = (
  resource: QuotaResourceName,
  value: number | null | undefined,
): string => {
  if (resource === 'cpu') return formatCpu(value);
  if (resource === 'memory') return formatMemory(value);
  return formatGpu(value);
};

/** Cores → CPU quantity for the API: 4 → `"4"`, 0.5 → `"500m"`. */
export const toCpuQuantity = (cores: number): string =>
  Number.isInteger(cores) ? String(cores) : `${Math.round(cores * 1000)}m`;

export type MemoryUnit = 'Gi' | 'Mi';

/**
 * A number as a plain decimal string, never in exponential notation and
 * with the precision the caller entered (`0.0625` stays `0.0625`, `1e-7`
 * becomes `0.0000001`).
 */
export const toPlainDecimal = (value: number): string => {
  const text = String(value);
  if (!text.includes('e')) return text;
  return value.toFixed(20).replace(/\.?0+$/, '');
};

/** Number + unit → memory quantity for the API: (16, 'Gi') → `"16Gi"`. */
export const toMemoryQuantity = (value: number, unit: MemoryUnit): string =>
  `${toPlainDecimal(value)}${unit}`;

/**
 * Bytes → the number and unit the edit form should show: whole GiB stay
 * GiB, everything else is shown in MiB, keeping fractions (to three
 * decimals) so a positive cap never prefills as zero.
 */
export const memoryToUnit = (
  bytes: number,
): { value: number; unit: MemoryUnit } => {
  if (Number.isInteger(bytes / GIB)) return { value: bytes / GIB, unit: 'Gi' };
  return { value: Number((bytes / MIB).toFixed(3)), unit: 'Mi' };
};

/** Percentage of the cap in use, clamped to 0-100 for drawing the bar. */
export const quotaPercent = (ratio: number | null | undefined): number => {
  if (ratio == null || Number.isNaN(ratio)) return 0;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
};

/** Bar colour: calm below 80%, amber up to 100%, red at or above the cap. */
export const quotaBarClass = (ratio: number | null | undefined): string => {
  if (ratio == null) return 'bg-primary/80';
  if (ratio >= 1) return 'bg-red-500';
  if (ratio >= 0.8) return 'bg-amber-500';
  return 'bg-primary/80';
};
