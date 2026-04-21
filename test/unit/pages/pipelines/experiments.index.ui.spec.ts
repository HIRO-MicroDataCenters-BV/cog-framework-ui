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
  getRunsByExperimentV2: vi.fn().mockResolvedValue([]),
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

const AppTableStub = defineComponent({
  name: 'AppTable',
  props: {
    dataSource: { type: Function, required: true },
  },
  methods: {
    fetchData() {
      return (
        this as { dataSource: (p: unknown) => Promise<unknown> }
      ).dataSource({});
    },
    resetExpanded() {},
  },
  template: '<div data-testid="app-table"><slot name="header-actions" /></div>',
});

describe('pages/pipelines/experiments/index.vue', () => {
  beforeEach(() => {
    apiMocks.getExperimentsListV2.mockClear();
    apiMocks.getRunsByExperimentV2.mockClear();
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

  const mountPage = () =>
    mount(ExperimentsPage, {
      global: {
        mocks: {
          $t: (key: string) => key,
        },
        stubs: {
          AppTable: AppTableStub,
          ExperimentRunsPanel: {
            template: '<div data-testid="runs-panel-stub" />',
          },
          CopyPaste: { template: '<span><slot /></span>' },
          RunStatusDots: { template: '<span data-testid="dots-stub" />' },
          Icon: { template: '<i />' },
        },
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
});
