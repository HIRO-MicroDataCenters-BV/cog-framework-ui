/**
 * Page tests for federated analyses: an order's participants are shown and
 * sent with their cohort sizes, the hand-entered (debug) participants are
 * sent when there is no order, the run button stays off until the form is
 * complete, and opening a run shows its steps, plot and association table.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';

import FederatedAnalysesPage from '~/pages/federated-analyses/index.vue';

const ANALYSES = [
  {
    id: 'gwas',
    title: 'Federated GWAS',
    description: 'GWAS across institutions.',
    min_parties: 2,
    requires_cohort_sizes: true,
    default_preset: 'ultra_fast',
    presets: [
      {
        id: 'ultra_fast',
        title: 'Ultra fast',
        description: 'First 1000 SNPs.',
        params: {},
      },
    ],
    params: [],
  },
];

const RUN = {
  run_id: 'run-1',
  run_name: 'fedanalysis-gwas-demo',
  analysis_id: 'gwas',
  name: 'demo',
  status: 'Succeeded',
  duration: '0:09:41',
  start_time: '2026-11-27T10:27:50',
};

const apiMocks = vi.hoisted(() => ({
  getFederatedAnalyses: vi.fn(),
  getFederatedAnalysisOrder: vi.fn(),
  getFederatedAnalysisRuns: vi.fn(),
  getFederatedAnalysisRun: vi.fn(),
  getFederatedAnalysisResult: vi.fn(),
  startFederatedAnalysisRun: vi.fn(),
  getArtifactPreview: vi.fn(),
}));
vi.mock('@/composables/api', () => ({ useApi: () => apiMocks }));

const intervalMocks = vi.hoisted(() => ({
  pause: vi.fn(),
  resume: vi.fn(),
}));
vi.mock('@vueuse/core', () => ({
  useIntervalFn: () => intervalMocks,
}));

const routeQuery = ref<Record<string, string>>({});

beforeAll(() => {
  vi.stubGlobal('useRoute', () => ({ query: routeQuery.value }));
  vi.stubGlobal('useApp', () => ({
    setPage: vi.fn(),
    page: ref({ isLoading: false }),
  }));
});

const stubs = {
  Icon: true,
  NuxtLink: defineComponent({
    props: { to: { type: String, default: '' } },
    setup(props, { slots }) {
      return () => h('a', { href: props.to }, slots.default?.());
    },
  }),
};

const mountPage = async () => {
  const wrapper = mount(FederatedAnalysesPage, {
    global: { stubs, mocks: { $t: (k: string) => k } },
  });
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.clearAllMocks();
  routeQuery.value = {};
  apiMocks.getFederatedAnalyses.mockResolvedValue({ data: ANALYSES });
  apiMocks.getFederatedAnalysisRuns.mockResolvedValue({ data: [RUN] });
  apiMocks.getFederatedAnalysisOrder.mockResolvedValue({
    data: {
      order_id: 'order-1',
      parties: [
        {
          institution: 'HUS',
          data_url: 'https://hus/b',
          num_individuals: null,
        },
        { institution: 'KI', data_url: 'https://ki/a', num_individuals: null },
      ],
    },
  });
  apiMocks.getFederatedAnalysisRun.mockResolvedValue({
    data: {
      ...RUN,
      steps: [{ id: 's1', name: 'create-manhattan-plot', status: 'Succeeded' }],
    },
  });
  apiMocks.getFederatedAnalysisResult.mockResolvedValue({
    data: {
      run_id: 'run-1',
      analysis_id: 'gwas',
      ready: true,
      metrics: { num_significant_snps: 0 },
      params: { num_snps: '521' },
      artifacts: [
        { name: 'manhattan_plot', path: 'plots/m.png', url: 's3://b/m.png' },
        {
          name: 'association_table',
          path: 'tables/a.csv',
          url: 's3://b/a.csv',
        },
      ],
    },
  });
  apiMocks.getArtifactPreview.mockImplementation(async (url: string) =>
    url.endsWith('.png')
      ? { data: { type: 'image', url: 'blob:plot' } }
      : {
          data: {
            type: 'csv',
            headers: ['chr', 'pos', 'p_value'],
            rows: [
              ['1', '100', '0.5'],
              ['1', '200', '0.01'],
            ],
          },
        },
  );
  apiMocks.startFederatedAnalysisRun.mockResolvedValue({ data: RUN });
});

describe('federated analyses page', () => {
  it('lists the catalog and earlier runs', async () => {
    const wrapper = await mountPage();

    expect(wrapper.findAll('[data-testid="analysis-card"]')).toHaveLength(1);
    expect(wrapper.text()).toContain('Federated GWAS');
    const rows = wrapper.findAll('[data-testid="run-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].text()).toContain('demo');
    expect(rows[0].find('[data-testid="run-status"]').text()).toBe('Succeeded');
    // Nothing is running, so nothing is polled.
    expect(intervalMocks.resume).not.toHaveBeenCalled();
  });

  it('runs the analysis on an order with the entered cohort sizes', async () => {
    routeQuery.value = { order_id: 'order-1' };
    const wrapper = await mountPage();

    expect(apiMocks.getFederatedAnalysisOrder).toHaveBeenCalledWith('order-1');
    expect(wrapper.find('[data-testid="order-parties"]').text()).toContain(
      'HUS',
    );
    const start = wrapper.find('[data-testid="start-run"]');
    expect(start.attributes('disabled')).toBeDefined();

    await wrapper.find('[data-testid="run-name"]').setValue('gwas-demo');
    const sizes = wrapper.findAll('[data-testid="order-parties"] input');
    await sizes[0].setValue(800);
    expect(wrapper.find('[data-testid="form-problem"]').text()).toContain(
      'number of individuals',
    );
    await sizes[1].setValue(1200);
    expect(start.attributes('disabled')).toBeUndefined();

    await start.trigger('click');
    await flushPromises();

    expect(apiMocks.startFederatedAnalysisRun).toHaveBeenCalledWith('gwas', {
      name: 'gwas-demo',
      preset: 'ultra_fast',
      order_id: 'order-1',
      num_individuals: { HUS: 800, KI: 1200 },
    });
  });

  it('sends hand-entered participants when there is no order', async () => {
    const wrapper = await mountPage();

    expect(apiMocks.getFederatedAnalysisOrder).not.toHaveBeenCalled();
    const rows = wrapper.findAll('[data-testid="manual-party"]');
    expect(rows).toHaveLength(2);
    const values = [
      ['HUS', 'https://hus/b', 1000],
      ['KI', 'https://ki/a', 1000],
    ];
    for (const [i, row] of rows.entries()) {
      const inputs = row.findAll('input');
      await inputs[0].setValue(values[i][0]);
      await inputs[1].setValue(values[i][1]);
      await inputs[2].setValue(values[i][2]);
    }
    await wrapper.find('[data-testid="run-name"]').setValue('manual');
    await wrapper.find('[data-testid="start-run"]').trigger('click');
    await flushPromises();

    expect(apiMocks.startFederatedAnalysisRun).toHaveBeenCalledWith('gwas', {
      name: 'manual',
      preset: 'ultra_fast',
      parties: [
        {
          institution: 'HUS',
          data_url: 'https://hus/b',
          num_individuals: 1000,
        },
        { institution: 'KI', data_url: 'https://ki/a', num_individuals: 1000 },
      ],
    });
  });

  it('shows steps, plot and association table of an opened run', async () => {
    const wrapper = await mountPage();

    await wrapper.find('[data-testid="open-run"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="run-steps"]').text()).toContain(
      'create-manhattan-plot',
    );
    expect(
      wrapper.find('[data-testid="manhattan-plot"]').attributes('src'),
    ).toBe('blob:plot');
    const table = wrapper.find('[data-testid="association-table"]');
    expect(table.text()).toContain('2 variants');
    expect(table.text()).toContain('p_value');
    expect(table.findAll('tbody tr')).toHaveLength(2);
  });

  it('keeps polling while the opened run has no results yet', async () => {
    apiMocks.getFederatedAnalysisRuns.mockResolvedValue({
      data: [{ ...RUN, status: 'Running' }],
    });
    apiMocks.getFederatedAnalysisRun.mockResolvedValue({
      data: { ...RUN, status: 'Running', steps: [] },
    });
    apiMocks.getFederatedAnalysisResult.mockResolvedValue({
      data: {
        run_id: 'run-1',
        analysis_id: 'gwas',
        ready: false,
        metrics: {},
        params: {},
        artifacts: [],
      },
    });
    const wrapper = await mountPage();
    expect(intervalMocks.resume).toHaveBeenCalled();

    await wrapper.find('[data-testid="open-run"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="result-pending"]').text()).toContain(
      'when the analysis finishes',
    );
    expect(apiMocks.getArtifactPreview).not.toHaveBeenCalled();
  });
});
