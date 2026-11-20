import { describe, it, expect } from 'vitest';
import {
  formatCpu,
  formatMemory,
  formatQuotaValue,
  memoryToUnit,
  parseCpuQuantity,
  parseMemoryQuantity,
  quotaBarClass,
  quotaPercent,
  toCpuQuantity,
  toMemoryQuantity,
} from '~/utils/quota';

const GIB = 1024 ** 3;

describe('quota quantities', () => {
  it('parses CPU and memory quantities', () => {
    expect(parseCpuQuantity('500m')).toBe(0.5);
    expect(parseCpuQuantity('4')).toBe(4);
    expect(parseCpuQuantity(null)).toBeNaN();
    expect(parseMemoryQuantity('16Gi')).toBe(16 * GIB);
    expect(parseMemoryQuantity('512Mi')).toBe(512 * 1024 ** 2);
    expect(parseMemoryQuantity('1G')).toBe(1e9);
    expect(parseMemoryQuantity('abc')).toBeNaN();
  });

  it('formats values for the cards', () => {
    expect(formatCpu(0.5)).toBe('0.5');
    expect(formatCpu(4)).toBe('4');
    expect(formatCpu(1.2599)).toBe('1.26');
    expect(formatCpu(null)).toBe('–');
    expect(formatMemory(16 * GIB)).toBe('16 GiB');
    expect(formatMemory(2.5 * GIB)).toBe('2.5 GiB');
    expect(formatMemory(256 * 1024 ** 2)).toBe('256 MiB');
    expect(formatQuotaValue('gpu', 2)).toBe('2');
  });

  it('builds API quantities from the form', () => {
    expect(toCpuQuantity(4)).toBe('4');
    expect(toCpuQuantity(0.5)).toBe('500m');
    expect(toCpuQuantity(2.25)).toBe('2250m');
    expect(toMemoryQuantity(16, 'Gi')).toBe('16Gi');
    expect(toMemoryQuantity(512, 'Mi')).toBe('512Mi');
  });

  it('prefills the memory unit from bytes', () => {
    expect(memoryToUnit(16 * GIB)).toEqual({ value: 16, unit: 'Gi' });
    expect(memoryToUnit(1.5 * GIB)).toEqual({ value: 1.5, unit: 'Gi' });
    expect(memoryToUnit(512 * 1024 ** 2)).toEqual({ value: 512, unit: 'Mi' });
  });

  it('clamps the bar and steps its colour at 80% and 100%', () => {
    expect(quotaPercent(null)).toBe(0);
    expect(quotaPercent(0.315)).toBe(32);
    expect(quotaPercent(1.4)).toBe(100);
    expect(quotaBarClass(0.5)).toBe('bg-primary/80');
    expect(quotaBarClass(0.8)).toBe('bg-amber-500');
    expect(quotaBarClass(1)).toBe('bg-red-500');
  });
});
