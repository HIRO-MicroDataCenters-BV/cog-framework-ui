import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import InputParameterEditor from '~/components/app/builder/InputParameterEditor.vue';

const getDatasets = vi.fn();

vi.mock('@/composables/api', () => ({
  useApi: () => ({ getDatasets }),
}));

vi.mock('~/composables/useBuilderColors', () => ({
  useBuilderColors: () => ({ getTypeColor: () => '#000' }),
}));
vi.mock('~/composables/useBuilderIcons', () => ({
  useBuilderIcons: () => ({ getTypeIcon: (type: string) => `icon:${type}` }),
}));

const passthrough = { template: '<div><slot /></div>' };
const SelectStub = {
  props: ['modelValue'],
  emits: ['update:modelValue', 'update:open'],
  template: '<div data-testid="select"><slot /></div>',
};
const SelectItemStub = {
  props: ['value'],
  template: '<div class="select-item" :data-value="value"><slot /></div>',
};

const mountEditor = (name: string, type = 'String', source = '') =>
  mount(InputParameterEditor, {
    props: {
      inputDefinition: { name, type },
      input: { destination: name, value_source_type: 'constant', source },
      availableComponents: [],
      pipelineParams: [],
    },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        Icon: true,
        Input: {
          props: ['modelValue'],
          template: '<input class="text-input" :value="modelValue" />',
        },
        Select: SelectStub,
        SelectTrigger: passthrough,
        SelectValue: passthrough,
        SelectContent: passthrough,
        SelectItem: SelectItemStub,
        CreateParameterDialog: true,
      },
    },
  });

beforeAll(() => {
  vi.stubGlobal('useApi', () => ({ getDatasets }));
});

beforeEach(() => {
  getDatasets.mockReset();
  getDatasets.mockResolvedValue({
    data: [
      { id: 'a48aeae6', dataset_name: 'iris-training-demo' },
      { id: '54a964ab', dataset_name: 'cifar10-mini' },
    ],
  });
});

describe('InputParameterEditor dataset picker', () => {
  it('offers the platform datasets for a dataset_id constant', async () => {
    const wrapper = mountEditor('dataset_id');
    await flushPromises();

    expect(getDatasets).toHaveBeenCalledWith({ limit: 200 });
    const picker = wrapper.find('[data-testid="dataset-picker"]');
    expect(picker.exists()).toBe(true);
    expect(picker.findAll('.select-item').map((i) => i.text())).toEqual([
      'iris-training-demo',
      'cifar10-mini',
    ]);
    expect(wrapper.find('.text-input').exists()).toBe(false);
  });

  it('keeps an id that is not in the list and allows manual entry', async () => {
    const wrapper = mountEditor('eval_dataset_id', 'String', 'deadbeef');
    await flushPromises();

    const values = wrapper
      .find('[data-testid="dataset-picker"]')
      .findAll('.select-item')
      .map((i) => i.attributes('data-value'));
    expect(values[0]).toBe('deadbeef');

    await wrapper
      .find('[data-testid="dataset-manual-toggle"]')
      .trigger('click');
    expect(wrapper.find('.text-input').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dataset-picker"]').exists()).toBe(false);
    await wrapper
      .find('[data-testid="dataset-picker-toggle"]')
      .trigger('click');
    expect(wrapper.find('[data-testid="dataset-picker"]').exists()).toBe(true);
  });

  it('emits the chosen dataset id as the constant', async () => {
    const wrapper = mountEditor('dataset_id');
    await flushPromises();
    wrapper
      .find('[data-testid="dataset-picker"]')
      .findComponent(SelectStub)
      .vm.$emit('update:modelValue', '54a964ab');
    await flushPromises();
    const updates = wrapper.emitted('update') ?? [];
    expect(updates.at(-1)?.[0]).toMatchObject({
      destination: 'dataset_id',
      value_source_type: 'constant',
      source: '54a964ab',
    });
  });

  it('retries the dataset request after a null (failed) response when the picker reopens', async () => {
    // the API layer resolves null on failure instead of rejecting
    getDatasets.mockResolvedValueOnce(null);
    const wrapper = mountEditor('dataset_id');
    await flushPromises();
    expect(getDatasets).toHaveBeenCalledTimes(1);
    expect(
      wrapper.find('[data-testid="dataset-picker"]').findAll('.select-item'),
    ).toHaveLength(0);

    getDatasets.mockResolvedValueOnce({
      data: [{ id: 'a48aeae6', dataset_name: 'iris-training-demo' }],
    });
    wrapper
      .find('[data-testid="dataset-picker"]')
      .findComponent(SelectStub)
      .vm.$emit('update:open', true);
    await flushPromises();
    expect(getDatasets).toHaveBeenCalledTimes(2);
    expect(
      wrapper
        .find('[data-testid="dataset-picker"]')
        .findAll('.select-item')
        .map((i) => i.text()),
    ).toEqual(['iris-training-demo']);
  });

  it('leaves other String constants as a text field', async () => {
    const wrapper = mountEditor('model_name');
    await flushPromises();
    expect(getDatasets).not.toHaveBeenCalled();
    expect(wrapper.find('.text-input').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dataset-picker"]').exists()).toBe(false);
  });
});
