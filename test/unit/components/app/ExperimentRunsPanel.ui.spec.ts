import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import dayjs from 'dayjs';
import ExperimentRunsPanel from '~/components/app/ExperimentRunsPanel.vue';

const archivePipelineRun = vi.fn();
const unarchivePipelineRun = vi.fn();
const deletePipelineRun = vi.fn();
const toasterShow = vi.fn();
const routerPush = vi.fn();

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
  vi.stubGlobal('useRouter', () => ({ push: routerPush }));
  vi.stubGlobal('useToaster', () => ({ show: toasterShow }));
});

const dialogStubs = {
  AlertDialog: {
    props: ['open'],
    template:
      '<div data-testid="bulk-alert" :data-open="open ? \'1\' : \'0\'"><slot v-if="open" /></div>',
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
  experimentTab?: 'active' | 'archived';
}) =>
  mount(ExperimentRunsPanel, {
    props: {
      runs: (options.runs ?? []) as never,
      experimentId: 'exp-1',
      experimentName: 'Test experiment',
      tab: options.tab ?? 'active',
      experimentTab: options.experimentTab ?? 'active',
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
    routerPush.mockReset();
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

  it('hides all bulk action buttons when experimentTab is archived', async () => {
    const wrapper = mountPanel({
      tab: 'active',
      experimentTab: 'archived',
      runs: [
        {
          run_id: 'r1',
          run_name: 'Run',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
      ],
    });

    await wrapper.find('.stub-checkbox').trigger('click');

    const btns = wrapper.findAll('button').map((b) => b.text());
    expect(btns.some((t) => /^Archive\s+\d/.test(t))).toBe(false);
    expect(btns.some((t) => /^Restore\s+\d/.test(t))).toBe(false);
    expect(btns.some((t) => /^Delete\s+\d/.test(t))).toBe(false);
  });

  it('bulk restore: archived tab confirm triggers unarchivePipelineRun per id', async () => {
    const wrapper = mountPanel({
      tab: 'archived',
      runs: [
        {
          run_id: 'a',
          run_name: 'A',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
        {
          run_id: 'b',
          run_name: 'B',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:01:00Z',
        },
      ],
    });

    const checkboxes = wrapper.findAll('.stub-checkbox');
    await checkboxes[1].trigger('click');
    await checkboxes[2].trigger('click');

    const restoreHeader = wrapper
      .findAll('button')
      .find((b) => /^Restore\s+\d/.test(b.text()));
    expect(restoreHeader).toBeTruthy();
    await restoreHeader!.trigger('click');

    expect(wrapper.find('.alert-title').text()).toContain('Restore 2 runs?');

    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Restore')!
      .trigger('click');
    await flushPromises();

    expect(unarchivePipelineRun).toHaveBeenCalledTimes(2);
    expect(unarchivePipelineRun).toHaveBeenCalledWith('a');
    expect(unarchivePipelineRun).toHaveBeenCalledWith('b');
    expect(toasterShow).toHaveBeenCalledWith(
      'success',
      'bulk_runs_restored_other',
      { count: 2 },
    );
  });

  it('bulk delete: confirm destructive action triggers deletePipelineRun per id', async () => {
    const wrapper = mountPanel({
      tab: 'archived',
      runs: [
        {
          run_id: 'x',
          run_name: 'X',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
      ],
    });

    await wrapper.find('.stub-checkbox').trigger('click');

    const deleteHeader = wrapper
      .findAll('button')
      .find((b) => /^Delete\s+\d/.test(b.text()));
    expect(deleteHeader).toBeTruthy();
    await deleteHeader!.trigger('click');

    expect(wrapper.find('.alert-title').text()).toContain('Delete 1 run?');

    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Delete')!
      .trigger('click');
    await flushPromises();

    expect(deletePipelineRun).toHaveBeenCalledTimes(1);
    expect(deletePipelineRun).toHaveBeenCalledWith('x');
    expect(toasterShow).toHaveBeenCalledWith(
      'success',
      'bulk_runs_deleted_one',
      undefined,
    );
  });

  it('shows error toast when all bulk archives fail', async () => {
    archivePipelineRun.mockRejectedValue(new Error('boom'));

    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'r1',
          run_name: 'R1',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
        {
          run_id: 'r2',
          run_name: 'R2',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:01:00Z',
        },
      ],
    });

    await wrapper.find('.stub-checkbox').trigger('click');
    await wrapper
      .findAll('button')
      .find((b) => /^Archive\s+\d/.test(b.text()))!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Archive')!
      .trigger('click');
    await flushPromises();

    expect(sonner.error).toHaveBeenCalled();
    expect(wrapper.emitted('mutated')).toBeFalsy();
  });

  it('clicking Cancel closes dialog without invoking API', async () => {
    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'r1',
          run_name: 'R',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
      ],
    });

    await wrapper.find('.stub-checkbox').trigger('click');
    await wrapper
      .findAll('button')
      .find((b) => /^Archive\s+\d/.test(b.text()))!
      .trigger('click');
    expect(
      wrapper.find('[data-testid="bulk-alert"]').attributes('data-open'),
    ).toBe('1');

    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'action.cancel')!
      .trigger('click');
    await flushPromises();

    expect(archivePipelineRun).not.toHaveBeenCalled();
    expect(
      wrapper.find('[data-testid="bulk-alert"]').attributes('data-open'),
    ).toBe('0');
  });

  it('keeps dialog open while bulkInFlight and disables confirm/cancel', async () => {
    let resolveArchive: (() => void) | undefined;
    archivePipelineRun.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveArchive = resolve;
        }),
    );

    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'r1',
          run_name: 'R',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
      ],
    });

    await wrapper.find('.stub-checkbox').trigger('click');
    await wrapper
      .findAll('button')
      .find((b) => /^Archive\s+\d/.test(b.text()))!
      .trigger('click');

    const confirmBtn = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Archive')!;
    await confirmBtn.trigger('click');
    await flushPromises();

    // In-flight: dialog open, confirm + cancel disabled.
    const alert = wrapper.find('[data-testid="bulk-alert"]');
    expect(alert.attributes('data-open')).toBe('1');
    const disabledButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('disabled') !== undefined)
      .map((b) => b.text().trim());
    expect(disabledButtons).toContain('Archive');
    expect(disabledButtons).toContain('action.cancel');

    // Cancel click during in-flight must not close the dialog.
    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'action.cancel')!
      .trigger('click');
    expect(
      wrapper.find('[data-testid="bulk-alert"]').attributes('data-open'),
    ).toBe('1');

    // Resolve and verify dialog closes.
    resolveArchive!();
    await flushPromises();
    expect(
      wrapper.find('[data-testid="bulk-alert"]').attributes('data-open'),
    ).toBe('0');
  });

  it('header checkbox selects all runs at once', async () => {
    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'a',
          run_name: 'A',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
        {
          run_id: 'b',
          run_name: 'B',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:01:00Z',
        },
      ],
    });

    // First .stub-checkbox is the header "select all" checkbox.
    await wrapper.find('.stub-checkbox').trigger('click');
    await flushPromises();

    const archiveHeader = wrapper
      .findAll('button')
      .find((b) => /^Archive\s+\d/.test(b.text()));
    expect(archiveHeader!.text()).toContain('Archive 2 runs');
  });

  it('Clear button resets selection to zero', async () => {
    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'r1',
          run_name: 'R',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
      ],
    });

    await wrapper.find('.stub-checkbox').trigger('click');
    expect(
      wrapper.findAll('button').some((b) => /^Archive\s+\d/.test(b.text())),
    ).toBe(true);

    const clearBtn = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Clear')!;
    await clearBtn.trigger('click');
    await flushPromises();

    expect(
      wrapper.findAll('button').some((b) => /^Archive\s+\d/.test(b.text())),
    ).toBe(false);
  });

  it('counts RUNNING/PENDING runs in the active aggregate', () => {
    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'a',
          run_name: 'A',
          status: 'RUNNING',
          created_at: '2025-06-01T12:00:00Z',
        },
        {
          run_id: 'b',
          run_name: 'B',
          status: 'PENDING',
          created_at: '2025-06-01T12:01:00Z',
        },
      ],
    });

    expect(wrapper.text()).toMatch(/2 active/);
  });

  it('renders Unknown label for an unknown status value', () => {
    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'u',
          run_name: 'Weird',
          status: 'NOT_A_REAL_STATUS',
          created_at: '2025-06-01T12:00:00Z',
        },
      ],
    });

    expect(wrapper.text()).toContain('NOT_A_REAL_STATUS');
  });

  it('clicking a run row navigates via router.push', async () => {
    const wrapper = mountPanel({
      runs: [
        {
          run_id: 'nav-1',
          run_name: 'Go',
          status: 'SUCCEEDED',
          created_at: '2025-06-01T12:00:00Z',
        },
      ],
    });

    await wrapper.find('[role="link"]').trigger('click');
    expect(routerPush).toHaveBeenCalledWith('/pipelines/nav-1');
  });

  it('relative time renders "just now" / "Xs ago" style labels', () => {
    const now = new Date();
    const fiveSecAgo = new Date(now.getTime() - 5000).toISOString();
    const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
    const threeHrAgo = new Date(
      now.getTime() - 3 * 60 * 60 * 1000,
    ).toISOString();
    const twoDaysAgo = new Date(
      now.getTime() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mountPanel({
      runs: [
        {
          run_id: '1',
          run_name: '1',
          status: 'SUCCEEDED',
          created_at: fiveSecAgo,
        },
        {
          run_id: '2',
          run_name: '2',
          status: 'SUCCEEDED',
          created_at: twoMinAgo,
        },
        {
          run_id: '3',
          run_name: '3',
          status: 'SUCCEEDED',
          created_at: threeHrAgo,
        },
        {
          run_id: '4',
          run_name: '4',
          status: 'SUCCEEDED',
          created_at: twoDaysAgo,
        },
      ],
    });

    const text = wrapper.text();
    expect(text).toContain('5s ago');
    expect(text).toContain('2m ago');
    expect(text).toContain('3h ago');
    expect(text).toContain('2d ago');
  });
});
