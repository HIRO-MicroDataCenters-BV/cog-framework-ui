import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import dayjs from 'dayjs';

import ExperimentsPage from '~/pages/pipelines/experiments/index.vue';

const apiMocks = vi.hoisted(() => ({
  getExperimentsListV2: vi.fn().mockResolvedValue({
    status_code: 200,
    data: [],
    pagination: {
      total_items: 0,
      page: 1,
      limit: 10,
      total_pages: 0,
      next_page_token: null,
    },
  }),
  getRunsByExperiment: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/composables/api', () => ({
  useApi: () => apiMocks,
}));

beforeAll(() => {
  vi.stubGlobal('useDayjs', () => dayjs);
  vi.stubGlobal('useApp', () => ({
    setPage: vi.fn(),
    page: ref({ isLoading: false }),
  }));
});

const resetExpandedSpy = vi.fn();

const AppTableStub = defineComponent({
  name: 'AppTable',
  props: {
    dataSource: { type: Function, required: true },
  },
  data() {
    return { rows: [] as Array<Record<string, unknown>> };
  },
  methods: {
    async fetchData() {
      const res = await (
        this as { dataSource: (p: unknown) => Promise<unknown> }
      ).dataSource({});
      const data = (res as { data?: Array<Record<string, unknown>> })?.data;
      (this as unknown as { rows: Array<Record<string, unknown>> }).rows =
        Array.isArray(data) ? data : [];
      return res;
    },
    resetExpanded(...args: unknown[]) {
      resetExpandedSpy(...args);
    },
  },
  template: `
    <div data-testid="app-table">
      <slot name="header-actions" />
      <div v-for="(row, i) in rows" :key="i" data-testid="expanded-row">
        <slot name="expanded" :row="row" />
      </div>
    </div>
  `,
});

describe('pages/pipelines/experiments/index.vue', () => {
  beforeEach(() => {
    apiMocks.getExperimentsListV2.mockClear();
    apiMocks.getRunsByExperiment.mockClear();
    resetExpandedSpy.mockClear();
    apiMocks.getExperimentsListV2.mockResolvedValue({
      status_code: 200,
      data: [],
      pagination: {
        total_items: 0,
        page: 1,
        limit: 10,
        total_pages: 0,
        next_page_token: null,
      },
    });
  });

  const ExperimentRunsPanelStub = defineComponent({
    name: 'ExperimentRunsPanel',
    props: {
      runs: { type: Array, default: () => [] },
      experimentId: { type: String, default: '' },
      experimentName: { type: String, default: '' },
      tab: { type: String, default: 'active' },
      experimentTab: { type: String, default: 'active' },
    },
    template:
      '<div data-testid="runs-panel-stub" :data-tab="tab" :data-experiment-tab="experimentTab" :data-experiment-id="experimentId" />',
  });

  const mountPage = () =>
    mount(ExperimentsPage, {
      global: {
        mocks: {
          $t: (key: string) => key,
        },
        stubs: {
          AppTable: AppTableStub,
          ExperimentRunsPanel: ExperimentRunsPanelStub,
          CopyPaste: { template: '<span><slot /></span>' },
          RunStatusDots: { template: '<span data-testid="dots-stub" />' },
          Icon: { template: '<i />' },
        },
      },
    });

  const twoExperiments = [
    { experiment_id: 'exp-1', experiment_name: 'One', namespace: 'ns-1' },
    { experiment_id: 'exp-2', experiment_name: 'Two', namespace: 'ns-2' },
  ];
  const withExperiments = (rows: Array<Record<string, unknown>>) =>
    apiMocks.getExperimentsListV2.mockResolvedValue({
      status_code: 200,
      data: rows,
      pagination: {
        total_items: rows.length,
        page: 1,
        limit: 10,
        total_pages: 1,
        next_page_token: null,
      },
    });

  it('renders Active / Archived segmented control in header-actions', () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain('Active');
    expect(wrapper.text()).toContain('Archived');
  });

  it('calls getExperimentsListV2 with storage_state NOT_ARCHIVED when fetch runs', async () => {
    const wrapper = mountPage();
    const table = wrapper.findComponent({ name: 'AppTable' });
    await (table.vm as { fetchData: () => Promise<unknown> }).fetchData();
    await flushPromises();

    expect(apiMocks.getExperimentsListV2).toHaveBeenCalledWith(
      expect.objectContaining({ storage_state: 'NOT_ARCHIVED' }),
    );
  });

  it('calls getExperimentsListV2 with storage_state ARCHIVED after Archived tab click', async () => {
    const wrapper = mountPage();
    const table = wrapper.findComponent({ name: 'AppTable' });

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Archived'))!
      .trigger('click');
    await flushPromises();

    await (table.vm as { fetchData: () => Promise<unknown> }).fetchData();
    await flushPromises();

    expect(apiMocks.getExperimentsListV2).toHaveBeenCalledWith(
      expect.objectContaining({ storage_state: 'ARCHIVED' }),
    );
  });

  it('calls getRunsByExperiment once per experiment to enrich last_runs', async () => {
    withExperiments(twoExperiments);
    apiMocks.getRunsByExperiment
      .mockResolvedValueOnce([{ run_id: 'r1' }])
      .mockResolvedValueOnce([{ run_id: 'r2' }]);

    const wrapper = mountPage();
    const table = wrapper.findComponent({ name: 'AppTable' });
    await (table.vm as { fetchData: () => Promise<unknown> }).fetchData();
    await flushPromises();

    expect(apiMocks.getRunsByExperiment).toHaveBeenCalledTimes(2);
    expect(apiMocks.getRunsByExperiment).toHaveBeenCalledWith('exp-1', {
      limit: 5,
      namespace: 'ns-1',
    });
    expect(apiMocks.getRunsByExperiment).toHaveBeenCalledWith('exp-2', {
      limit: 5,
      namespace: 'ns-2',
    });
  });

  it('resets expanded rows and refetches when switching tabs', async () => {
    const wrapper = mountPage();
    const table = wrapper.findComponent({ name: 'AppTable' });
    await (table.vm as { fetchData: () => Promise<unknown> }).fetchData();
    await flushPromises();

    apiMocks.getExperimentsListV2.mockClear();

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Archived'))!
      .trigger('click');
    await flushPromises();

    expect(resetExpandedSpy).toHaveBeenCalledTimes(1);
    expect(apiMocks.getExperimentsListV2).toHaveBeenCalledWith(
      expect.objectContaining({ storage_state: 'ARCHIVED' }),
    );
  });

  it('forwards tab="active" and experiment-tab=activeTab to ExperimentRunsPanel', async () => {
    withExperiments([twoExperiments[0]]);

    const wrapper = mountPage();
    const table = wrapper.findComponent({ name: 'AppTable' });
    await (table.vm as { fetchData: () => Promise<unknown> }).fetchData();
    await flushPromises();

    let panel = wrapper.find('[data-testid="runs-panel-stub"]');
    expect(panel.exists()).toBe(true);
    expect(panel.attributes('data-tab')).toBe('active');
    expect(panel.attributes('data-experiment-tab')).toBe('active');
    expect(panel.attributes('data-experiment-id')).toBe('exp-1');

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Archived'))!
      .trigger('click');
    await flushPromises();
    await (table.vm as { fetchData: () => Promise<unknown> }).fetchData();
    await flushPromises();

    panel = wrapper.find('[data-testid="runs-panel-stub"]');
    expect(panel.attributes('data-tab')).toBe('active');
    expect(panel.attributes('data-experiment-tab')).toBe('archived');
  });
});
