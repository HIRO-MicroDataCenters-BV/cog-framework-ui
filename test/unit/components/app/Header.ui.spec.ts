import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { shallowMount } from '@vue/test-utils';
import Header from '~/components/app/Header.vue';

const pageRef = ref({
  section: 'pipeline_runs',
  title: '',
  data: { builder: { name: 'Test Pipeline', nodes: [] } },
});

beforeEach(() => {
  pageRef.value.section = 'pipeline_runs';
  pageRef.value.title = '';
});

globalThis.useApp = () => ({ page: pageRef });
globalThis.usePipelineBuilder = () => ({
  nodes: ref([]),
  outputNodeIds: ref([]),
  pipelineParameters: ref([]),
});
globalThis.useNodeValidation = () => ({
  isNodeValid: () => true,
});
globalThis.useBuilderEvents = () => ({
  openManageParameters: vi.fn(),
});
globalThis.useRoute = () => ({ query: {} });
globalThis.useApi = () => ({
  postTrainingBuilderPipeline: vi.fn(),
  postTrainingBuilderPipelineDataspaceFederatedRun: vi.fn(),
});
globalThis.useRuntimeConfig = () => ({
  public: { federatedEnabled: false },
});
const permissions = ref<string[]>(['pipeline:create', 'pipeline:run']);
beforeEach(() => {
  permissions.value = ['pipeline:create', 'pipeline:run'];
});
globalThis.useEntitlements = () => ({
  hasPermission: (p: string) => permissions.value.includes(p),
  loaded: ref(true),
  error: ref(null),
  fetchEntitlements: vi.fn(),
});

describe('Header component', () => {
  it('maps pipeline_runs breadcrumb to /pipelines/run', () => {
    const wrapper = shallowMount(Header, {
      global: {
        mocks: {
          $t: (key: string) => key,
        },
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :data-to="to"><slot /></a>',
          },
          Icon: true,
          Breadcrumb: { template: '<nav><slot /></nav>' },
          BreadcrumbList: { template: '<ol><slot /></ol>' },
          BreadcrumbItem: { template: '<li><slot /></li>' },
          BreadcrumbSeparator: { template: '<span>/</span>' },
          Input: true,
          Button: true,
        },
      },
    });

    const link = wrapper.find('a[data-to="/pipelines/run"]');
    expect(link.exists()).toBe(true);
  });
});

describe('Header run submission', () => {
  const mountBuilderHeader = (post: ReturnType<typeof vi.fn>) => {
    pageRef.value.section = 'pipelines_builder';
    globalThis.useApi = () => ({
      postTrainingBuilderPipeline: post,
      postTrainingBuilderPipelineDataspaceFederatedRun: vi.fn(),
    });
    return shallowMount(Header, {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: {
          NuxtLink: true,
          Icon: true,
          Breadcrumb: { template: '<nav><slot /></nav>' },
          BreadcrumbList: { template: '<ol><slot /></ol>' },
          BreadcrumbItem: { template: '<li><slot /></li>' },
          BreadcrumbSeparator: { template: '<span>/</span>' },
          Input: true,
          Button: {
            template:
              '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
          },
          Dialog: {
            props: ['open'],
            template:
              '<div :data-open="open ? \'1\' : \'0\'"><slot v-if="open" /></div>',
          },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<h2><slot /></h2>' },
          DialogDescription: { template: '<p><slot /></p>' },
          DialogFooter: { template: '<div><slot /></div>' },
        },
      },
    });
  };

  it('offers to monitor the run once the API returns a run id', async () => {
    const navigate = vi.fn();
    globalThis.navigateTo = navigate;
    const post = vi.fn().mockResolvedValue({ data: { run_id: 'run-123' } });
    const wrapper = mountBuilderHeader(post);

    await (
      wrapper.vm as unknown as {
        submitStandardRun: (p: unknown) => Promise<void>;
      }
    ).submitStandardRun({ name: 'x' });
    await wrapper.vm.$nextTick();

    expect(post).toHaveBeenCalledWith({ name: 'x' });
    const monitor = wrapper.find('[data-testid="run-started-monitor"]');
    expect(monitor.exists()).toBe(true);
    await monitor.trigger('click');
    expect(navigate).toHaveBeenCalledWith('/pipelines/run-123');
  });

  it('locks Save & Run when the plan cannot run pipelines', () => {
    const runLocked = (wrapper: ReturnType<typeof mountBuilderHeader>) =>
      (wrapper.vm as unknown as { runLocked: boolean }).runLocked;
    expect(runLocked(mountBuilderHeader(vi.fn()))).toBe(false);
    permissions.value = ['pipeline:read'];
    expect(runLocked(mountBuilderHeader(vi.fn()))).toBe(true);
  });

  it('stays quiet when the API returns no run id', async () => {
    const post = vi.fn().mockResolvedValue({ data: { run_id: null } });
    const wrapper = mountBuilderHeader(post);
    await (
      wrapper.vm as unknown as {
        submitStandardRun: (p: unknown) => Promise<void>;
      }
    ).submitStandardRun({ name: 'y' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="run-started-monitor"]').exists()).toBe(
      false,
    );
  });
});
