/**
 * Component tests for the FineTuneCreate dialog.
 *
 * Stub out the heavy UI primitives so the test focuses on the
 * dialog's behavior: picker filtering (LLMs with hf_model_id only;
 * JSONL datasets only), auto-fill from the fine-tune recommender on
 * base-model select, the submitted FineTuneRequest payload shape, the
 * max_log_gate bound, and the NTK <-> LoRA method switch (which fields
 * show, the per-method learning-rate default, and the payload keys).
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import FineTuneCreate from '~/components/app/dialog/FineTuneCreate.vue';

const getModels = vi.fn();
const getDatasets = vi.fn();
const createFineTune = vi.fn();
const recommendFineTune = vi.fn();
// Shared spy so tests can assert which toasts the dialog fires.
const toasterShow = vi.fn();

vi.mock('@/composables/api', () => ({
  useApi: () => ({
    getModels,
    getDatasets,
    createFineTune,
    recommendFineTune,
  }),
}));

beforeAll(() => {
  // Mirror the real composable, which exposes only `show(...)` — stubbing
  // extra helpers would mask a `toaster.error(...)`-style bug in the SUT.
  vi.stubGlobal('useToaster', () => ({
    show: toasterShow,
  }));
});

const stubs = {
  Dialog: {
    name: 'Dialog',
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
    name: 'Select',
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
  toasterShow.mockReset();
});

describe('FineTuneCreate', () => {
  it('filters base-model picker to LLM rows with hf_model_id only', async () => {
    getModels.mockResolvedValueOnce({
      data: [
        {
          id: 'm-1234567890',
          name: 'qwen-7b',
          type: 'llm',
          hf_model_id: 'Qwen/7b',
        },
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
    const items = wrapper.findAll('[data-value]');
    const itemIds = items.map((el) => el.attributes('data-value'));
    expect(itemIds).toContain('m-1234567890');
    expect(itemIds).not.toContain('m-2');
    expect(itemIds).not.toContain('m-3');
    // Base option label: "{name} ({hf_model_id}) · {id.slice(0, 8)}" — the
    // short id suffix disambiguates duplicate catalog names.
    const base = items.find(
      (el) => el.attributes('data-value') === 'm-1234567890',
    )!;
    expect(base.text().replace(/\s+/g, ' ')).toBe(
      'qwen-7b (Qwen/7b) · m-123456',
    );
  });

  it('suffixes duplicate-named base options with distinct short ids', async () => {
    getModels.mockResolvedValueOnce({
      data: [
        {
          id: 'aaaaaaaa-1111',
          name: 'Qwen2.5-0.5B-Instruct',
          type: 'llm',
          hf_model_id: 'Qwen/Qwen2.5-0.5B-Instruct',
        },
        {
          id: 'bbbbbbbb-2222',
          name: 'Qwen2.5-0.5B-Instruct',
          type: 'llm',
          hf_model_id: 'Qwen/Qwen2.5-0.5B-Instruct',
        },
      ],
    });
    getDatasets.mockResolvedValueOnce({ data: [] });

    const wrapper = mountDialog();
    await flushPromises();

    // Selects: [0] base model (the export Select also renders items).
    const labels = wrapper
      .findAllComponents({ name: 'Select' })[0]
      .findAll('[data-value]')
      .map((el) => el.text().replace(/\s+/g, ' '));
    expect(labels).toEqual([
      'Qwen2.5-0.5B-Instruct (Qwen/Qwen2.5-0.5B-Instruct) · aaaaaaaa',
      'Qwen2.5-0.5B-Instruct (Qwen/Qwen2.5-0.5B-Instruct) · bbbbbbbb',
    ]);
    expect(new Set(labels).size).toBe(2);
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
    const selects = wrapper.findAllComponents({ name: 'Select' });
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

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');

    // The stubbed `useI18n` echoes the key, so the button renders its i18n
    // key rather than the English label.
    const submit = wrapper
      .findAll('button')
      .find((b) => b.text().includes('action.launch_fine_tune'));
    await submit!.trigger('click');
    await flushPromises();

    expect(createFineTune).toHaveBeenCalledWith({
      base_model_id: 'm-1',
      dataset_id: 'd-1',
      output_name: 'adapter-x',
      method: 'ntk',
      // Default export: the exact NTK controller.
      export: 'ntk_model',
      hyperparams: {
        gates: 5000,
        max_log_gate: 0.05,
        train_steps: 240,
        lr: 0.005,
      },
    });
    // NTK never sends the LoRA-only knobs.
    const hyperparams = createFineTune.mock.calls[0][0].hyperparams;
    expect(hyperparams).not.toHaveProperty('lora_rank');
    expect(hyperparams).not.toHaveProperty('lora_alpha');
    expect(wrapper.emitted('created')?.[0]?.[0]).toEqual({
      model_id: 'mi-1',
      run_id: 'run-1',
    });
  });

  it('offers both exports with the NTK controller first and sends "lora" when chosen', async () => {
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
    recommendFineTune.mockResolvedValueOnce({ data: {} });
    createFineTune.mockResolvedValueOnce({
      data: { model_id: 'mi-1', run_id: 'run-1' },
    });

    const wrapper = mountDialog();
    await flushPromises();

    // Selects: [0] base model, [1] training dataset, [2] eval dataset,
    // [3] method, [4] export.
    const selects = wrapper.findAllComponents({ name: 'Select' });
    expect(
      selects[4]
        .findAll('[data-value]')
        .map((el) => el.attributes('data-value')),
    ).toEqual(['ntk_model', 'lora']);
    expect(selects[4].text()).toContain('label.export_ntk_model');
    expect(selects[4].text()).toContain('label.export_lora');
    expect(wrapper.text()).toContain('hint.fine_tune_export');

    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    selects[4].vm.$emit('update:modelValue', 'lora');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('action.launch_fine_tune'))!
      .trigger('click');
    await flushPromises();

    expect(createFineTune).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'ntk', export: 'lora' }),
    );
  });

  it('eval picker lists JSONL datasets minus the one chosen for training', async () => {
    getModels.mockResolvedValueOnce({ data: [] });
    getDatasets.mockResolvedValueOnce({
      data: [
        { id: 'd-1', dataset_name: 'train', train_and_inference_type: 5 },
        { id: 'd-2', dataset_name: 'heldout', train_and_inference_type: 5 },
        { id: 'd-csv', dataset_name: 'csv', train_and_inference_type: 0 },
      ],
    });

    const wrapper = mountDialog();
    await flushPromises();

    // Selects: [0] base model, [1] training dataset, [2] eval dataset.
    const selects = wrapper.findAllComponents({ name: 'Select' });
    const evalItems = () =>
      selects[2]
        .findAll('[data-value]')
        .map((el) => el.attributes('data-value'));

    // Before a training pick: both JSONL rows (never the CSV one) plus "None".
    expect(evalItems()).toContain('d-1');
    expect(evalItems()).toContain('d-2');
    expect(evalItems()).not.toContain('d-csv');

    selects[1].vm.$emit('update:modelValue', 'd-1');
    await flushPromises();
    expect(evalItems()).not.toContain('d-1');
    expect(evalItems()).toContain('d-2');
  });

  it('submits eval_dataset_id when a held-out dataset is picked', async () => {
    getModels.mockResolvedValueOnce({
      data: [
        { id: 'm-1', name: 'qwen', type: 'llm', hf_model_id: 'Qwen/0.5B' },
      ],
    });
    getDatasets.mockResolvedValueOnce({
      data: [
        { id: 'd-1', dataset_name: 'train', train_and_inference_type: 5 },
        { id: 'd-2', dataset_name: 'heldout', train_and_inference_type: 5 },
      ],
    });
    recommendFineTune.mockResolvedValueOnce({ data: {} });
    createFineTune.mockResolvedValueOnce({
      data: { model_id: 'mi-1', run_id: 'run-1' },
    });

    const wrapper = mountDialog();
    await flushPromises();

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    selects[2].vm.$emit('update:modelValue', 'd-2');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('action.launch_fine_tune'))!
      .trigger('click');
    await flushPromises();

    expect(createFineTune).toHaveBeenCalledWith(
      expect.objectContaining({
        base_model_id: 'm-1',
        dataset_id: 'd-1',
        eval_dataset_id: 'd-2',
        export: 'ntk_model',
      }),
    );
  });

  it('omits eval_dataset_id when "None" is picked or the training set is re-picked as eval', async () => {
    getModels.mockResolvedValue({
      data: [
        { id: 'm-1', name: 'qwen', type: 'llm', hf_model_id: 'Qwen/0.5B' },
      ],
    });
    getDatasets.mockResolvedValue({
      data: [
        { id: 'd-1', dataset_name: 'train', train_and_inference_type: 5 },
        { id: 'd-2', dataset_name: 'heldout', train_and_inference_type: 5 },
      ],
    });
    recommendFineTune.mockResolvedValue({ data: {} });
    createFineTune.mockResolvedValue({
      data: { model_id: 'mi-1', run_id: 'run-1' },
    });

    const wrapper = mountDialog();
    await flushPromises();

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[0].vm.$emit('update:modelValue', 'm-1');
    // Pick the eval set first, then choose the same row for training: the
    // eval choice must be dropped rather than sent twice.
    selects[2].vm.$emit('update:modelValue', 'd-2');
    selects[1].vm.$emit('update:modelValue', 'd-2');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');

    const submit = () =>
      wrapper
        .findAll('button')
        .find((b) => b.text().includes('action.launch_fine_tune'))!
        .trigger('click');

    await submit();
    await flushPromises();
    expect(createFineTune).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ eval_dataset_id: expect.anything() }),
    );

    // Explicit "None" sentinel must map to "no key" as well.
    selects[2].vm.$emit('update:modelValue', '__none__');
    await flushPromises();
    await submit();
    await flushPromises();
    expect(createFineTune).toHaveBeenCalledTimes(2);
    expect(createFineTune.mock.calls[1][0]).not.toHaveProperty(
      'eval_dataset_id',
    );
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

  it('handles a null picker response gracefully (empty pickers, no own toast)', async () => {
    // request() returns null (not a throw) on HTTP/network error and owns the
    // error toast itself; the dialog must not add a second one — it just
    // narrows to empty pickers and shows its empty-state hints.
    getModels.mockResolvedValueOnce(null);
    getDatasets.mockResolvedValueOnce(null);

    const wrapper = mountDialog();
    await flushPromises();

    // Selects: [0] base, [1] dataset, [2] eval come from the API and stay
    // empty; [3] method and [4] export are static and always render their
    // two options each.
    const selects = wrapper.findAllComponents({ name: 'Select' });
    expect(
      selects.slice(0, 3).flatMap((s) => s.findAll('[data-value]')),
    ).toHaveLength(0);
    expect(toasterShow).not.toHaveBeenCalled();
  });

  it('blocks close and disables Cancel while a submit is in flight', async () => {
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
    recommendFineTune.mockResolvedValueOnce({ data: {} });
    // A submit that never resolves keeps `submitting` true for the assertions.
    let resolveCreate: (v: unknown) => void = () => {};
    createFineTune.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    const wrapper = mountDialog();
    await flushPromises();

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');

    const submit = wrapper
      .findAll('button')
      .find((b) => b.text().includes('action.launch_fine_tune'));
    await submit!.trigger('click');
    await flushPromises();

    // Cancel is disabled mid-submit...
    const cancel = wrapper
      .findAll('button')
      .find((b) => b.text().includes('action.cancel'));
    expect(cancel!.attributes('disabled')).toBeDefined();

    // ...and an Escape / outside-click close attempt is swallowed (no
    // `update:open=false` while submitting).
    wrapper.findComponent({ name: 'Dialog' }).vm.$emit('update:open', false);
    await flushPromises();
    const openEvents = wrapper.emitted('update:open') ?? [];
    expect(openEvents.some(([value]) => value === false)).toBe(false);

    // Let the in-flight request settle so the test leaves no pending work.
    resolveCreate({ data: { model_id: 'mi-1', run_id: null } });
    await flushPromises();
  });

  it('blocks submit when a knob is non-finite (1e999 → Infinity)', async () => {
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
    recommendFineTune.mockResolvedValueOnce({ data: {} });

    const wrapper = mountDialog();
    await flushPromises();

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');

    // '1e999' coerces to Infinity, which JSON.stringify would serialize to
    // `null`. The validator must reject it so no bad payload is submittable.
    await wrapper.find('#ft-gates').setValue('1e999');

    const submit = wrapper
      .findAll('button')
      .find((b) => b.text().includes('action.launch_fine_tune'));
    expect(submit!.attributes('disabled')).toBeDefined();
    await submit!.trigger('click');
    await flushPromises();
    expect(createFineTune).not.toHaveBeenCalled();
  });

  // ---- Method: NTK (default) vs standard LoRA -------------------------------

  const mountWithPickers = async () => {
    getModels.mockResolvedValue({
      data: [
        { id: 'm-1', name: 'qwen', type: 'llm', hf_model_id: 'Qwen/0.5B' },
      ],
    });
    getDatasets.mockResolvedValue({
      data: [
        { id: 'd-1', dataset_name: 'jsonl-1', train_and_inference_type: 5 },
      ],
    });
    recommendFineTune.mockResolvedValue({ data: {} });
    createFineTune.mockResolvedValue({
      data: { model_id: 'mi-1', run_id: 'run-1' },
    });
    const wrapper = mountDialog();
    await flushPromises();
    return wrapper;
  };

  const inputValue = (wrapper: ReturnType<typeof mountDialog>, id: string) =>
    (wrapper.find(id).element as HTMLInputElement).value;

  const launchButton = (wrapper: ReturnType<typeof mountDialog>) =>
    wrapper
      .findAll('button')
      .find((b) => b.text().includes('action.launch_fine_tune'))!;

  it('offers NTK (default) and LoRA methods above the export picker', async () => {
    const wrapper = await mountWithPickers();

    // Selects: [0] base, [1] dataset, [2] eval, [3] method, [4] export.
    const selects = wrapper.findAllComponents({ name: 'Select' });
    expect(
      selects[3]
        .findAll('[data-value]')
        .map((el) => el.attributes('data-value')),
    ).toEqual(['ntk', 'lora']);
    expect(selects[3].text()).toContain('label.method_ntk');
    expect(selects[3].text()).toContain('label.method_lora');
    expect(wrapper.text()).toContain('hint.fine_tune_method');
    expect(selects[3].props('modelValue')).toBe('ntk');

    // NTK default: export + gates visible, LoRA knobs absent, lr 0.005.
    expect(wrapper.find('#ft-export').exists()).toBe(true);
    expect(wrapper.find('#ft-gates').exists()).toBe(true);
    expect(wrapper.find('#ft-max-log-gate').exists()).toBe(true);
    expect(wrapper.find('#ft-lora-rank').exists()).toBe(false);
    expect(wrapper.find('#ft-lora-alpha').exists()).toBe(false);
    expect(inputValue(wrapper, '#ft-lr')).toBe('0.005');
  });

  it('LoRA method hides export/gates, shows rank/alpha, sets lr 0.0002 and sends the LoRA payload', async () => {
    const wrapper = await mountWithPickers();

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    selects[3].vm.$emit('update:modelValue', 'lora');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');

    expect(wrapper.find('#ft-export').exists()).toBe(false);
    expect(wrapper.find('#ft-gates').exists()).toBe(false);
    expect(wrapper.find('#ft-max-log-gate').exists()).toBe(false);
    expect(wrapper.find('#ft-lora-rank').exists()).toBe(true);
    expect(wrapper.find('#ft-lora-alpha').exists()).toBe(true);
    expect(inputValue(wrapper, '#ft-lora-rank')).toBe('8');
    expect(inputValue(wrapper, '#ft-lora-alpha')).toBe('16');
    expect(inputValue(wrapper, '#ft-lr')).toBe('0.0002');
    // Steps / learning rate stay shared between the two methods.
    expect(wrapper.find('#ft-train-steps').exists()).toBe(true);

    await launchButton(wrapper).trigger('click');
    await flushPromises();

    expect(createFineTune).toHaveBeenCalledWith({
      base_model_id: 'm-1',
      dataset_id: 'd-1',
      output_name: 'adapter-x',
      method: 'lora',
      // Forced: the backend rejects `ntk_model` for the LoRA method.
      export: 'lora',
      hyperparams: {
        // Still sent (numeric); ignored by the backend for LoRA.
        gates: 5000,
        max_log_gate: 0.05,
        train_steps: 240,
        lr: 0.0002,
        lora_rank: 8,
        lora_alpha: 16,
      },
    });
  });

  it('switching back to NTK restores export/gates, hides rank/alpha and resets lr to 0.005', async () => {
    const wrapper = await mountWithPickers();

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[3].vm.$emit('update:modelValue', 'lora');
    await flushPromises();
    expect(inputValue(wrapper, '#ft-lr')).toBe('0.0002');

    selects[3].vm.$emit('update:modelValue', 'ntk');
    await flushPromises();

    expect(wrapper.find('#ft-export').exists()).toBe(true);
    expect(wrapper.find('#ft-gates').exists()).toBe(true);
    expect(wrapper.find('#ft-max-log-gate').exists()).toBe(true);
    expect(wrapper.find('#ft-lora-rank').exists()).toBe(false);
    expect(wrapper.find('#ft-lora-alpha').exists()).toBe(false);
    expect(inputValue(wrapper, '#ft-lr')).toBe('0.005');
  });

  it('keeps a user-edited learning rate across method switches', async () => {
    const wrapper = await mountWithPickers();

    await wrapper.find('#ft-lr').setValue('0.001');

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[3].vm.$emit('update:modelValue', 'lora');
    await flushPromises();
    expect(inputValue(wrapper, '#ft-lr')).toBe('0.001');

    selects[3].vm.$emit('update:modelValue', 'ntk');
    await flushPromises();
    expect(inputValue(wrapper, '#ft-lr')).toBe('0.001');
  });

  it('blocks Launch under LoRA unless rank and alpha are positive integers', async () => {
    const wrapper = await mountWithPickers();

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    selects[3].vm.$emit('update:modelValue', 'lora');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');
    expect(launchButton(wrapper).attributes('disabled')).toBeUndefined();

    // Non-integer rank.
    await wrapper.find('#ft-lora-rank').setValue('2.5');
    expect(launchButton(wrapper).attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('hint.fine_tune_lora_rank_range');

    // Zero alpha (rank valid again).
    await wrapper.find('#ft-lora-rank').setValue('4');
    await wrapper.find('#ft-lora-alpha').setValue('0');
    expect(launchButton(wrapper).attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('hint.fine_tune_lora_alpha_range');

    await launchButton(wrapper).trigger('click');
    await flushPromises();
    expect(createFineTune).not.toHaveBeenCalled();

    // Valid again → submit goes through with the edited ints.
    await wrapper.find('#ft-lora-alpha').setValue('32');
    expect(launchButton(wrapper).attributes('disabled')).toBeUndefined();
    await launchButton(wrapper).trigger('click');
    await flushPromises();
    expect(createFineTune).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'lora',
        export: 'lora',
        hyperparams: expect.objectContaining({ lora_rank: 4, lora_alpha: 32 }),
      }),
    );
  });

  it('a stale invalid gates edit does not block LoRA and is sent as the numeric default', async () => {
    const wrapper = await mountWithPickers();

    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter-x');
    // Break an NTK-only knob, then switch to LoRA (which hides it).
    await wrapper.find('#ft-gates').setValue('1e999');
    expect(launchButton(wrapper).attributes('disabled')).toBeDefined();

    selects[3].vm.$emit('update:modelValue', 'lora');
    await flushPromises();
    expect(launchButton(wrapper).attributes('disabled')).toBeUndefined();

    await launchButton(wrapper).trigger('click');
    await flushPromises();
    // Never `null`/Infinity: the schema still expects a number.
    expect(createFineTune.mock.calls[0][0].hyperparams.gates).toBe(5000);
  });
  it('hidden NTK knobs are sent as schema defaults under LoRA regardless of stale edits', async () => {
    const wrapper = await mountWithPickers();
    const selects = wrapper.findAllComponents({ name: 'Select' });
    selects[0].vm.$emit('update:modelValue', 'm-1');
    selects[1].vm.$emit('update:modelValue', 'd-1');
    await flushPromises();
    await wrapper.find('#ft-output-name').setValue('adapter');
    await wrapper.find('#ft-gates').setValue('');
    await wrapper.find('#ft-max-log-gate').setValue('2');
    selects[3].vm.$emit('update:modelValue', 'lora');
    await flushPromises();
    await launchButton(wrapper).trigger('click');
    await flushPromises();
    const body = createFineTune.mock.calls[0][0];
    expect(body.hyperparams.gates).toBe(5000);
    expect(body.hyperparams.max_log_gate).toBe(0.05);
  });
});
