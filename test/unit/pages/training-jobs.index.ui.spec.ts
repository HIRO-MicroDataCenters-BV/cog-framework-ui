/**
 * Page tests for the training-jobs list: rows render with state and model
 * link, the poll starts only while a job is in flight, the create dialog
 * opens from the header action, and delete goes through the API then
 * refreshes.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import dayjs from 'dayjs';

import TrainingJobsPage from '~/pages/training-jobs/index.vue';

const JOBS = [
  {
    id: 'job-done',
    user_id: 'u',
    name: 'iris-mlp',
    job_name: 'tj-aaaaaaaa',
    namespace: 'admin',
    framework: 'pytorch',
    algorithm_id: 'pytorch-tabular-classifier',
    task: 'classification',
    dataset_id: 'ds-1',
    target_column: 'species',
    hyperparams: {},
    workers: 1,
    gpus: 0,
    image: 'img',
    state: 'succeeded',
    message: null,
    model_id: 'model-1',
    created_at: '2026-10-19T10:00:00',
    updated_at: '2026-10-19T10:05:00',
    started_at: '2026-10-19T10:00:10',
    finished_at: '2026-10-19T10:05:00',
  },
];

const apiMocks = vi.hoisted(() => ({
  getTrainingJobs: vi.fn(),
  deleteTrainingJob: vi.fn().mockResolvedValue(null),
  getTrainingJobLogs: vi
    .fn()
    .mockResolvedValue({ data: { lines: [], message: null } }),
  getTrainingAlgorithms: vi.fn().mockResolvedValue({ data: [] }),
  getDatasets: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('@/composables/api', () => ({ useApi: () => apiMocks }));

const intervalMocks = vi.hoisted(() => ({
  pause: vi.fn(),
  resume: vi.fn(),
}));
vi.mock('@vueuse/core', () => ({
  useIntervalFn: () => intervalMocks,
}));

const routerPush = vi.fn();

// The page renders these through `h(Component)` on imported module objects,
// which `global.stubs` (name-based) cannot intercept — swap the modules.
vi.mock('@/components/app/menu/Actions.vue', async () => {
  const { defineComponent, h } = await import('vue');
  return {
    default: defineComponent({
      name: 'DropdownAction',
      props: {
        items: { type: Array, default: () => [] },
        id: [String, Number],
        title: String,
        menuTitle: String,
      },
      render() {
        return h(
          'div',
          { 'data-testid': 'actions' },
          (this.items as Array<{ key: string; action: () => void }>).map((it) =>
            h(
              'button',
              { 'data-action': it.key, onClick: () => it.action() },
              it.key,
            ),
          ),
        );
      },
    }),
  };
});
vi.mock('~/components/app/CopyPaste.vue', async () => {
  const { defineComponent, h } = await import('vue');
  return {
    default: defineComponent({
      name: 'CopyPaste',
      render() {
        return h('span', {}, this.$slots.default?.());
      },
    }),
  };
});

beforeAll(() => {
  vi.stubGlobal('useDayjs', () => dayjs);
  vi.stubGlobal('useRouter', () => ({ push: routerPush }));
  vi.stubGlobal('useApp', () => ({
    setPage: vi.fn(),
    page: ref({ isLoading: false }),
  }));
  vi.stubGlobal('resolveComponent', (name: string) =>
    defineComponent({
      name,
      props: { to: { type: String, default: '' } },
      setup(props, { slots }) {
        return () =>
          h('a', { href: props.to, 'data-link': name }, slots.default?.());
      },
    }),
  );
  vi.stubGlobal('h', h);
});

const fetchDataSpy = vi.fn();

/** Renders every column cell for every row so cell renderers are exercised. */
const AppTableStub = defineComponent({
  name: 'AppTable',
  props: {
    dataSource: { type: Function, required: true },
    columns: { type: Array, default: () => [] },
  },
  data() {
    return { rows: [] as Array<Record<string, unknown>> };
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData(opts?: unknown) {
      fetchDataSpy(opts);
      const res = await (
        this as { dataSource: (p: unknown) => Promise<unknown> }
      ).dataSource({
        page: 1,
        limit: 15,
      });
      const data = (res as { data?: Array<Record<string, unknown>> })?.data;
      (this as unknown as { rows: Array<Record<string, unknown>> }).rows =
        Array.isArray(data) ? data : [];
      return res;
    },
  },
  render() {
    const cols = this.columns as Array<{
      id: string;
      cell?: (ctx: {
        row: { original: unknown; getValue: (k: string) => unknown };
      }) => unknown;
    }>;
    return h('div', { 'data-testid': 'app-table' }, [
      this.$slots['header-actions']?.(),
      ...this.rows.map((row, i) =>
        h(
          'div',
          { 'data-testid': 'row', key: i },
          cols.map((c) =>
            h(
              'div',
              { 'data-col': c.id },
              c.cell
                ? [
                    c.cell({
                      row: {
                        original: row,
                        getValue: (k: string) =>
                          (row as Record<string, unknown>)[k],
                      },
                    }) as never,
                  ]
                : [],
            ),
          ),
        ),
      ),
    ]);
  },
});

const stubs = {
  AppTable: AppTableStub,
  TrainingJobCreate: {
    name: 'TrainingJobCreate',
    props: ['open'],
    template:
      '<div data-testid="create-dialog" :data-open="open ? \'1\' : \'0\'" />',
  },
  TrainingJobLogsSheet: {
    name: 'TrainingJobLogsSheet',
    props: ['open', 'job'],
    template:
      '<div data-testid="logs-sheet" :data-open="open ? \'1\' : \'0\'" :data-job="job?.id ?? \'\'" />',
  },
  Button: { template: '<button v-bind="$attrs"><slot /></button>' },
  Icon: { template: '<i />' },
};

const mountPage = () => mount(TrainingJobsPage, { global: { stubs } });

beforeEach(() => {
  apiMocks.getTrainingJobs.mockReset();
  apiMocks.deleteTrainingJob.mockClear();
  intervalMocks.pause.mockClear();
  intervalMocks.resume.mockClear();
  fetchDataSpy.mockClear();
  routerPush.mockClear();
});

describe('pages/training-jobs/index.vue', () => {
  it('renders jobs with state badge and model link, synthesising pagination', async () => {
    apiMocks.getTrainingJobs.mockResolvedValue({
      status_code: 200,
      data: JOBS,
    });
    const wrapper = mountPage();
    await flushPromises();

    expect(apiMocks.getTrainingJobs).toHaveBeenCalledWith({
      page: 1,
      limit: 15,
    });
    const rows = wrapper.findAll('[data-testid="row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].text()).toContain('iris-mlp');
    expect(rows[0].text()).toContain('tj-aaaaaaaa');
    expect(rows[0].find('[data-testid="job-state"]').text()).toBe('Succeeded');
    const link = rows[0].find('[data-testid="model-link"]');
    expect(link.attributes('href')).toBe('/models/model-1');
    // Settled jobs: polling paused.
    expect(intervalMocks.pause).toHaveBeenCalled();
    expect(intervalMocks.resume).not.toHaveBeenCalled();
  });

  it('starts polling while a job is in flight and stops when it settles', async () => {
    apiMocks.getTrainingJobs.mockResolvedValueOnce({
      status_code: 200,
      data: [{ ...JOBS[0], id: 'job-run', state: 'running', model_id: null }],
      pagination: { total_items: 1, page: 1, limit: 15 },
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(intervalMocks.resume).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="model-link"]').exists()).toBe(false);

    apiMocks.getTrainingJobs.mockResolvedValueOnce({
      status_code: 200,
      data: JOBS,
    });
    const table = wrapper.findComponent({ name: 'AppTable' });
    await (
      table.vm as unknown as { fetchData: (o?: unknown) => Promise<unknown> }
    ).fetchData({
      silent: true,
    });
    await flushPromises();
    expect(intervalMocks.pause).toHaveBeenCalled();
    // The silent flag is not forwarded to the API as a query parameter.
    expect(apiMocks.getTrainingJobs).toHaveBeenLastCalledWith({
      page: 1,
      limit: 15,
    });
  });

  it('opens the create dialog from the header action', async () => {
    apiMocks.getTrainingJobs.mockResolvedValue({ status_code: 200, data: [] });
    const wrapper = mountPage();
    await flushPromises();
    expect(
      wrapper.find('[data-testid="create-dialog"]').attributes('data-open'),
    ).toBe('0');
    await wrapper.find('[data-testid="new-training-job"]').trigger('click');
    expect(
      wrapper.find('[data-testid="create-dialog"]').attributes('data-open'),
    ).toBe('1');
  });

  it('opens logs, navigates to the model and deletes through the API', async () => {
    apiMocks.getTrainingJobs.mockResolvedValue({
      status_code: 200,
      data: JOBS,
    });
    const wrapper = mountPage();
    await flushPromises();

    await wrapper.find('[data-action="view_logs"]').trigger('click');
    await flushPromises();
    const sheet = wrapper.find('[data-testid="logs-sheet"]');
    expect(sheet.attributes('data-open')).toBe('1');
    expect(sheet.attributes('data-job')).toBe('job-done');

    await wrapper.find('[data-action="open_model"]').trigger('click');
    expect(routerPush).toHaveBeenCalledWith('/models/model-1');

    fetchDataSpy.mockClear();
    await wrapper.find('[data-action="delete_training_job"]').trigger('click');
    await flushPromises();
    expect(apiMocks.deleteTrainingJob).toHaveBeenCalledWith('job-done');
    expect(fetchDataSpy).toHaveBeenCalled();
  });

  it('keeps polling across a failed silent refresh', async () => {
    apiMocks.getTrainingJobs.mockResolvedValueOnce({
      status_code: 200,
      data: [{ ...JOBS[0], id: 'job-run', state: 'running', model_id: null }],
      pagination: { total_items: 1, page: 1, limit: 15 },
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(intervalMocks.resume).toHaveBeenCalledTimes(1);
    intervalMocks.pause.mockClear();

    // request() returns null on a transient failure.
    apiMocks.getTrainingJobs.mockResolvedValueOnce(null);
    const table = wrapper.findComponent({ name: 'AppTable' });
    await (
      table.vm as unknown as { fetchData: (o?: unknown) => Promise<unknown> }
    ).fetchData({ silent: true });
    await flushPromises();
    expect(intervalMocks.pause).not.toHaveBeenCalled();
  });
});
