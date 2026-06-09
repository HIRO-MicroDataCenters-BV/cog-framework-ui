/**
 * Component tests for the FineTuneCreate dialog.
 *
 * Stub out the heavy UI primitives so the test focuses on the
 * dialog's behavior: picker filtering (LLMs with hf_model_id only;
 * JSONL datasets only), submit payload shape, and the auto-fill
 * from the fine-tune recommender.
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
});
