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
