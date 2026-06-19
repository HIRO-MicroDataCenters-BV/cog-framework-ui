/**
 * Component tests for the FineTuneCreate dialog.
 *
 * Stub out the heavy UI primitives so the test focuses on the
 * dialog's behavior: picker filtering (LLMs with hf_model_id only;
 * JSONL datasets only), auto-fill from the fine-tune recommender on
 * base-model select, the submitted FineTuneRequest payload shape, and
 * the max_log_gate bound.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import FineTuneCreate from '~/components/app/dialog/FineTuneCreate.vue';

const getModels = vi.fn();
const getDatasets = vi.fn();
const createFineTune = vi.fn();
const recommendFineTune = vi.fn();

vi.mock('@/composables/api', () => ({
  useApi: () => ({
    getModels,
    getDatasets,
    createFineTune,
    recommendFineTune,
  }),
}));

beforeAll(() => {
  vi.stubGlobal('useToaster', () => ({
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }));
});

const stubs = {
  Dialog: {
    props: ['open'],
    template:
      '<div data-testid="dialog" :data-open="open ? \'1\' : \'0\'"><slot v-if="open" /></div>',
  },
  DialogContent: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogFooter: { template: '<div class="footer"><slot /></div>' },
  Label: { template: '<label><slot /></label>' },
  Input: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  Select: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      "<div data-testid=\"select\"><slot /><button :data-testid=\"$attrs['data-testid'] || 'pick-option'\" @click=\"$emit('update:modelValue', $attrs['data-test-value'])\">pick</button></div>",
  },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<span><slot /></span>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: {
    props: ['value'],
    template: '<div :data-value="value"><slot /></div>',
  },
  Button: {
    template: '<button v-bind="$attrs"><slot /></button>',
  },
  Spinner: { template: '<span class="spinner" />' },
  Icon: { template: '<i />' },
};

const mountDialog = (open = true) =>
  mount(FineTuneCreate, {
    props: { open },
    global: { stubs },
  });

beforeEach(() => {
  getModels.mockReset();
  getDatasets.mockReset();
  createFineTune.mockReset();
  recommendFineTune.mockReset();
});

describe('FineTuneCreate', () => {
  it('filters base-model picker to LLM rows with hf_model_id only', async () => {
    getModels.mockResolvedValueOnce({
      data: [
        { id: 'm-1', name: 'qwen-7b', type: 'llm', hf_model_id: 'Qwen/7b' },
        // type=classical → must be filtered out
        { id: 'm-2', name: 'classical', type: 'classical', hf_model_id: 'X' },
        // LLM without hf_model_id → filtered out (kfp component needs it)
        { id: 'm-3', name: 'llm-no-hf', type: 'llm', hf_model_id: null },
      ],
    });
    getDatasets.mockResolvedValueOnce({ data: [] });

    const wrapper = mountDialog();
    await flushPromises();

    // Rendered SelectItem elements carry data-value=<id>
    const itemIds = wrapper
      .findAll('[data-value]')
      .map((el) => el.attributes('data-value'));
    expect(itemIds).toContain('m-1');
    expect(itemIds).not.toContain('m-2');
    expect(itemIds).not.toContain('m-3');
  });

  it('filters dataset picker to JSONL (train_and_inference_type=5) only', async () => {
    getModels.mockResolvedValueOnce({ data: [] });
    getDatasets.mockResolvedValueOnce({
      data: [
        { id: 'd-jsonl', dataset_name: 'jsonl-1', train_and_inference_type: 5 },
        // Non-JSONL dataset types are dropped silently per Phase 1 contract.
        { id: 'd-train', dataset_name: 'train-1', train_and_inference_type: 0 },
        { id: 'd-llm', dataset_name: 'llm-1', train_and_inference_type: 4 },
      ],
    });

    const wrapper = mountDialog();
    await flushPromises();

    const itemIds = wrapper
      .findAll('[data-value]')
      .map((el) => el.attributes('data-value'));
    expect(itemIds).toContain('d-jsonl');
    expect(itemIds).not.toContain('d-train');
    expect(itemIds).not.toContain('d-llm');
  });

  it('does not invoke recommender when no base model is selected yet', async () => {
    getModels.mockResolvedValueOnce({ data: [] });
    getDatasets.mockResolvedValueOnce({ data: [] });

    mountDialog();
    await flushPromises();

    expect(recommendFineTune).not.toHaveBeenCalled();
  });

  it('reloads pickers when the dialog re-opens', async () => {
    getModels.mockResolvedValue({ data: [] });
    getDatasets.mockResolvedValue({ data: [] });

    const wrapper = mountDialog(false);
    await flushPromises();
    expect(getModels).not.toHaveBeenCalled();

    await wrapper.setProps({ open: true });
    await flushPromises();
    expect(getModels).toHaveBeenCalledTimes(1);
    expect(getDatasets).toHaveBeenCalledTimes(1);

    // Closing then re-opening triggers a fresh load.
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    await flushPromises();
    expect(getModels).toHaveBeenCalledTimes(2);
  });

  it('auto-fills hyperparams from the recommender when a base model is selected', async () => {
    getModels.mockResolvedValueOnce({
      data: [
        { id: 'm-1', name: 'qwen', type: 'llm', hf_model_id: 'Qwen/0.5B' },
      ],
    });
    getDatasets.mockResolvedValueOnce({ data: [] });
    recommendFineTune.mockResolvedValueOnce({
      data: { gates: 1234, max_log_gate: 0.07, train_steps: 99 },
    });

    const wrapper = mountDialog();
    await flushPromises();

    // Selecting the base model (first Select) triggers the recommender fill.
    const selects = wrapper.findAllComponents('[data-testid="select"]');
    selects[0].vm.$emit('update:modelValue', 'm-1');
    await flushPromises();

    expect(recommendFineTune).toHaveBeenCalledWith({
      hf_model_id: 'Qwen/0.5B',
      method: 'ntk',
    });
    expect((wrapper.find('#ft-gates').element as HTMLInputElement).value).toBe(
      '1234',
    );
    expect(
      (wrapper.find('#ft-max-log-gate').element as HTMLInputElement).value,
    ).toBe('0.07');
    expect(
      (wrapper.find('#ft-train-steps').element as HTMLInputElement).value,
    ).toBe('99');
  });

  it('submits the FineTuneRequest payload the backend expects', async () => {
    getModels.mockResolvedValueOnce({
      data: [
        { id: 'm-1', name: 'qwen', type: 'llm', hf_model_id: 'Qwen/0.5B' },
      ],
    });
    getDatasets.mockResolvedValueOnce({
      data: [
        { id: 'd-1', dataset_name: 'jsonl-1', train_and_inference_type: 5 },
      ],
    });
    // Empty recommendation → form keeps the static ntkmirror defaults.
    recommendFineTune.mockResolvedValueOnce({ data: {} });
    createFineTune.mockResolvedValueOnce({
      data: { model_id: 'mi-1', run_id: 'run-1' },
    });

    const wrapper = mountDialog();
    await flushPromises();

    const selects = wrapper.findAllComponents('[data-testid="select"]');
    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');

    const submit = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Launch fine-tune'));
    await submit!.trigger('click');
    await flushPromises();

    expect(createFineTune).toHaveBeenCalledWith({
      base_model_id: 'm-1',
      dataset_id: 'd-1',
      output_name: 'adapter-x',
      method: 'ntk',
      export: 'lora',
      hyperparams: {
        gates: 5000,
        max_log_gate: 0.05,
        train_steps: 240,
        lr: 0.005,
      },
    });
    expect(wrapper.emitted('created')?.[0]?.[0]).toEqual({
      model_id: 'mi-1',
      run_id: 'run-1',
    });
  });

  it('caps max_log_gate at 1 to match the backend bound (le=1.0)', async () => {
    getModels.mockResolvedValueOnce({ data: [] });
    getDatasets.mockResolvedValueOnce({ data: [] });

    const wrapper = mountDialog();
    await flushPromises();

    // The server rejects max_log_gate > 1.0 (422); the input must declare the
    // upper bound so the form can't submit a value the backend will reject.
    expect(wrapper.find('#ft-max-log-gate').attributes('max')).toBe('1');
  });
});
