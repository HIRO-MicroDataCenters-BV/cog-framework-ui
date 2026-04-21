import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import dayjs from 'dayjs';
import ExperimentRunsPanel from '~/components/app/ExperimentRunsPanel.vue';

const archivePipelineRun = vi.fn();
const unarchivePipelineRun = vi.fn();
const deletePipelineRun = vi.fn();
const toasterShow = vi.fn();

const sonner = vi.hoisted(() => ({
  error: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@/composables/api', () => ({
  useApi: () => ({
    archivePipelineRun,
    unarchivePipelineRun,
    deletePipelineRun,
  }),
}));

vi.mock('vue-sonner', () => ({
  toast: sonner,
}));

beforeAll(() => {
  vi.stubGlobal('useDayjs', () => dayjs);
  vi.stubGlobal('useRouter', () => ({ push: vi.fn() }));
  vi.stubGlobal('useToaster', () => ({ show: toasterShow }));
});

const dialogStubs = {
  AlertDialog: {
    props: ['open'],
    template: '<div v-show="open" data-testid="bulk-alert"><slot /></div>',
  },
  AlertDialogContent: { template: '<div><slot /></div>' },
  AlertDialogHeader: { template: '<div><slot /></div>' },
  AlertDialogTitle: { template: '<div class="alert-title"><slot /></div>' },
  AlertDialogDescription: { template: '<div><slot /></div>' },
  AlertDialogFooter: { template: '<div class="alert-footer"><slot /></div>' },
};

/** Minimal checkbox: click always selects (emits true). */
const CheckboxStub = {
  name: 'Checkbox',
  props: {
    modelValue: { type: [Boolean, String], default: false },
  },
  emits: ['update:modelValue'],
  template:
    '<button type="button" role="checkbox" class="stub-checkbox" @click="$emit(\'update:modelValue\', true)" />',
};

const mountPanel = (options: {
  runs?: Array<Record<string, unknown>>;
  tab?: 'active' | 'archived';
}) =>
  mount(ExperimentRunsPanel, {
    props: {
      runs: (options.runs ?? []) as never,
      experimentId: 'exp-1',
      experimentName: 'Test experiment',
      tab: options.tab ?? 'active',
    },
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        ...dialogStubs,
        Button: {
          inheritAttrs: true,
          template: '<button type="button" v-bind="$attrs"><slot /></button>',
        },
        Checkbox: CheckboxStub,
        TooltipProvider: { template: '<div><slot /></div>' },
        Loader2: { template: '<span class="loader-stub" />' },
      },
    },
  });

describe('ExperimentRunsPanel', () => {
  beforeEach(() => {
    archivePipelineRun.mockReset().mockResolvedValue(undefined);
    unarchivePipelineRun.mockReset().mockResolvedValue(undefined);
    deletePipelineRun.mockReset().mockResolvedValue(undefined);
    toasterShow.mockReset();
    sonner.error.mockReset();
    sonner.warning.mockReset();
    sonner.success.mockReset();
  });

  it('shows empty state when there are no runs', () => {
    const wrapper = mountPanel({ runs: [] });
    expect(wrapper.text()).toContain('No runs yet for this experiment.');
  });

  it('lists run names and status labels', () => {
    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'r1',
          run_name: 'Alpha run',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
          duration: '1m',
        },
      ],
    });
    expect(wrapper.text()).toContain('Alpha run');
    expect(wrapper.text()).toContain('Succeeded');
    expect(wrapper.text()).toContain('Recent runs');
  });

  it('shows aggregate succeeded / failed counts in the header', () => {
    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'a',
          run_name: 'ok',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
        {
          run_id: 'b',
          run_name: 'bad',
          status: 'FAILED',
          created_at: '2025-06-01T12:01:00Z',
        },
      ],
    });
    expect(wrapper.text()).toMatch(/1 succeeded/);
    expect(wrapper.text()).toMatch(/1 failed/);
  });

  it('bulk archive: select all, confirm dialog, calls archive per run and success toast', async () => {
    const wrapper = mountPanel({
      tab: 'active',
      runs: [
        {
          run_id: 'id-1',
          run_name: 'Run one',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
        {
          run_id: 'id-2',
          run_name: 'Run two',
          status: 'FAILED',
          created_at: '2025-06-01T12:01:00Z',
        },
      ],
    });

    const checkboxes = wrapper.findAll('.stub-checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
    await checkboxes[0].trigger('click');

    const archiveHeader = wrapper
      .findAll('button')
      .find(
        (b) =>
          b.text().includes('Archive') &&
          /\d/.test(b.text()) &&
          b.text().includes('run'),
      );
    expect(archiveHeader).toBeTruthy();
    await archiveHeader!.trigger('click');

    expect(wrapper.find('[data-testid="bulk-alert"]').exists()).toBe(true);
    expect(wrapper.find('.alert-title').text()).toContain('Archive 2 runs?');

    const confirmBtn = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Archive');
    expect(confirmBtn).toBeTruthy();
    await confirmBtn!.trigger('click');
    await flushPromises();

    expect(archivePipelineRun).toHaveBeenCalledTimes(2);
    expect(archivePipelineRun).toHaveBeenCalledWith('id-1');
    expect(archivePipelineRun).toHaveBeenCalledWith('id-2');
    expect(toasterShow).toHaveBeenCalledWith(
      'success',
      'bulk_runs_archived_other',
      { count: 2 },
    );
  });

  it('archived tab: shows Restore and Delete bulk actions after selection', async () => {
    const wrapper = mountPanel({
      tab: 'archived',
      runs: [
        {
          run_id: 'r1',
          run_name: 'Old',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
      ],
    });

    await wrapper.find('.stub-checkbox').trigger('click');

    expect(
      wrapper
        .findAll('button')
        .some((b) => b.text().includes('Restore') && b.text().includes('run')),
    ).toBe(true);
    expect(
      wrapper.findAll('button').some((b) => b.text().includes('Delete')),
    ).toBe(true);
  });

  it('emits mutated when at least one bulk archive succeeds', async () => {
    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'only',
          run_name: 'Solo',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
      ],
    });

    await wrapper.find('.stub-checkbox').trigger('click');
    await wrapper
      .findAll('button')
      .find(
        (b) =>
          b.text().includes('Archive') &&
          /\d/.test(b.text()) &&
          b.text().includes('run'),
      )!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Archive')!
      .trigger('click');
    await flushPromises();

    expect(wrapper.emitted('mutated')).toBeTruthy();
    expect(wrapper.emitted('mutated')!.length).toBeGreaterThanOrEqual(1);
  });

  it('shows partial warning toast when some bulk archives fail', async () => {
    archivePipelineRun
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('nope'));

    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'ok',
          run_name: 'A',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
        {
          run_id: 'bad',
          run_name: 'B',
          status: 'FAILED',
          created_at: '2025-06-01T12:01:00Z',
        },
      ],
    });

    await wrapper.find('.stub-checkbox').trigger('click');
    await wrapper
      .findAll('button')
      .find(
        (b) =>
          b.text().includes('Archive') &&
          /\d/.test(b.text()) &&
          b.text().includes('run'),
      )!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Archive')!
      .trigger('click');
    await flushPromises();

    expect(sonner.warning).toHaveBeenCalled();
    expect(toasterShow).not.toHaveBeenCalledWith(
      'success',
      'bulk_runs_archived_other',
      expect.anything(),
    );
  });
});
