import { describe, it, expect, beforeAll, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import RunStatusDots from '~/components/app/RunStatusDots.vue';

beforeAll(() => {
  vi.stubGlobal('useDayjs', () => dayjs);
});

const tooltipStubs = {
  TooltipProvider: { template: '<div><slot /></div>' },
  Tooltip: { template: '<div><slot /></div>' },
  TooltipTrigger: { template: '<div><slot /></div>' },
  TooltipContent: { template: '<div class="tooltip-content"><slot /></div>' },
};

describe('RunStatusDots', () => {
  const mountDots = (runs: Array<Record<string, unknown>> = []) =>
    mount(RunStatusDots, {
      props: { runs },
      global: { stubs: tooltipStubs },
    });

  it('renders a dash when there are no runs', () => {
    const wrapper = mountDots([]);
    expect(wrapper.text()).toContain('-');
  });

  it('renders one status dot per run', () => {
    const wrapper = mountDots([
      {
        run_id: 'a',
        run_name: 'r1',
        status: 'SUCCEEDED',
        created_at: '2025-06-01T12:00:00Z',
      },
      {
        run_id: 'b',
        run_name: 'r2',
        status: 'FAILED',
        created_at: '2025-06-02T12:00:00Z',
      },
    ]);
    const dots = wrapper.findAll('.rounded-full');
    expect(dots).toHaveLength(2);
  });

  it('reverses API order so oldest run appears first (left)', () => {
    const wrapper = mountDots([
      {
        run_id: 'new',
        run_name: 'newest',
        status: 'SUCCEEDED',
        created_at: '2025-06-02T12:00:00Z',
      },
      {
        run_id: 'old',
        run_name: 'oldest',
        status: 'FAILED',
        created_at: '2025-06-01T12:00:00Z',
      },
    ]);
    const dots = wrapper.findAll('.rounded-full');
    expect(dots[0].text()).toContain('!');
    expect(dots[1].classes()).toContain('bg-emerald-500');
  });

  it('renders unknown status with fallback glyph', () => {
    const wrapper = mountDots([
      {
        run_id: 'x',
        run_name: 'weird',
        status: 'MY_CUSTOM',
        created_at: null,
      },
    ]);
    expect(wrapper.find('.rounded-full').text()).toContain('?');
  });
});
