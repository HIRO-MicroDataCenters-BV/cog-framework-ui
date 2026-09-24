import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ServeModelDialog from '~/components/app/dialog/ServeModelDialog.vue';

const postModelServing = vi.fn();
const recommendModelServing = vi.fn();
const getModels = vi.fn();

vi.mock('@/composables/api', () => ({
  useApi: () => ({ postModelServing, recommendModelServing, getModels }),
}));

beforeAll(() => {
  vi.stubGlobal('useToaster', () => ({ show: vi.fn() }));
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
  Separator: { template: '<hr />' },
  Input: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', ($event.target).value)" />',
  },
  Textarea: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<textarea v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', ($event.target).value)" />',
  },
  Label: { template: '<label><slot /></label>' },
  Select: {
    name: 'Select',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="select-stub"><slot /></div>',
  },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<span><slot /></span>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: {
    props: ['value'],
    template: '<div :data-value="value"><slot /></div>',
  },
  Button: {
    inheritAttrs: true,
    template: '<button type="button" v-bind="$attrs"><slot /></button>',
  },
  Icon: { template: '<i />' },
};

const mountDialog = (open = true) =>
  mount(ServeModelDialog, {
    props: { open },
    global: {
      stubs,
      mocks: { $t: (k: string) => k },
    },
  });

type W = ReturnType<typeof mountDialog>;

const findButton = (wrapper: W, label: string) =>
  wrapper.findAll('button').find((b) => b.text().trim() === label);

const clickLlmTab = async (wrapper: W) => {
  await wrapper
    .findAll('button')
    .find((b) => b.text().includes('LLM from Hugging Face'))!
    .trigger('click');
  await flushPromises();
};

describe('ServeModelDialog', () => {
  beforeEach(() => {
    postModelServing.mockReset().mockResolvedValue({ status_code: 201 });
    // Default: recommend returns null so existing tier tests exercise the
    // local-fallback path via recommendForUsers().
    recommendModelServing.mockReset().mockResolvedValue(null);
    getModels.mockReset().mockResolvedValue({ data: [] });
  });

  it('renders closed when open=false', () => {
    const wrapper = mountDialog(false);
    expect(wrapper.find('[data-testid="dialog"]').attributes('data-open')).toBe(
      '0',
    );
  });

  it('starts in classical mode and shows all section headers', () => {
    const wrapper = mountDialog();
    expect(wrapper.text()).toContain('Classical model');
    expect(wrapper.text()).toContain('LLM from Hugging Face');
    expect(wrapper.text()).toContain('Basics');
    expect(wrapper.text()).toContain('Advanced');
  });

  it('disables Serve until model_id is filled; still validates isvc format when typed', async () => {
    const wrapper = mountDialog();
    expect(findButton(wrapper, 'Serve')!.attributes('disabled')).toBeDefined();

    // Input order: [0] isvc_name, [1] model_id
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Invalid_Name');
    await inputs[1].setValue('uuid');
    expect(findButton(wrapper, 'Serve')!.attributes('disabled')).toBeDefined();

    // Clear the invalid isvc — model_id alone should enable Serve
    await inputs[0].setValue('');
    await flushPromises();
    expect(
      findButton(wrapper, 'Serve')!.attributes('disabled'),
    ).toBeUndefined();
  });

  it('submits classical minimum payload (only model_id)', async () => {
    const wrapper = mountDialog();
    const inputs = wrapper.findAll('input');
    await inputs[1].setValue('550e8400-e29b-41d4-a716-446655440002');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    expect(postModelServing).toHaveBeenCalledTimes(1);
    const [body, options] = postModelServing.mock.calls[0];
    expect(body).toEqual({
      model_id: '550e8400-e29b-41d4-a716-446655440002',
      protocol_version: 'v2',
    });
    expect(options).toEqual({ successMessage: 'model_serving_created' });
  });

  it('classical includes isvc_name only when filled', async () => {
    const wrapper = mountDialog();
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('hp3');
    await inputs[1].setValue('uuid');
    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toMatchObject({ model_id: 'uuid', isvc_name: 'hp3' });
  });

  it('blocks classical submit when transformer JSON is invalid', async () => {
    const wrapper = mountDialog();
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('hp3');
    await inputs[1].setValue('uuid');

    await wrapper.find('textarea').setValue('{ not valid');
    await flushPromises();
    expect(findButton(wrapper, 'Serve')!.attributes('disabled')).toBeDefined();
  });

  it('LLM mode: only hf_model_id is required; Serve enabled as soon as it is filled', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);

    expect(wrapper.text()).toContain('Served model name');
    expect(wrapper.text()).toContain('Hugging Face model ID');
    expect(wrapper.text()).toContain('Model settings');
    expect(wrapper.text()).toContain('Concurrent users');
    // Resources, Tolerations, Min/Max replicas are intentionally hidden (kept
    // in template behind v-if="false" for future use).
    expect(wrapper.text()).not.toContain('Resources');
    expect(wrapper.text()).not.toContain('Tolerations');
    expect(wrapper.text()).not.toContain('Min replicas');
    expect(wrapper.text()).not.toContain('Max replicas');

    expect(findButton(wrapper, 'Serve')!.attributes('disabled')).toBeDefined();

    // Input order: [0] hf_model_id, [1] isvc_name, [2] served_model_name
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Qwen/Qwen2.5-Coder-7B-Instruct');
    await flushPromises();
    expect(
      findButton(wrapper, 'Serve')!.attributes('disabled'),
    ).toBeUndefined();
  });

  it('submits LLM minimum payload (only hf_model_id; tolerations no longer sent)', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Qwen/Qwen2.5-Coder-7B-Instruct');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toEqual({
      hf_model_id: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    });
    expect(body.tolerations).toBeUndefined();
  });

  it('includes isvc_name and served_model_name only when filled', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Qwen/Qwen2.5-Coder-7B-Instruct');
    await inputs[1].setValue('qwen25-coder');
    await inputs[2].setValue('my-served-name');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toMatchObject({
      hf_model_id: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      isvc_name: 'qwen25-coder',
      served_model_name: 'my-served-name',
    });
  });

  // ---------------------------------------------------------------------------
  // LLM mode: "From catalog" source (base row + optional adapter, either a
  // LoRA export or an exact NTK controller)
  // ---------------------------------------------------------------------------

  const catalogRows = [
    { id: 'llm-1', name: 'Qwen Coder', type: 'llm', hf_model_id: 'Qwen/7B' },
    { id: 'llm-2', name: 'Llama', type: 'llm', hf_model_id: 'meta/llama' },
    // LLM without hf_model_id → not servable, filtered out.
    { id: 'llm-3', name: 'no-hf', type: 'llm', hf_model_id: null },
    { id: 'lora-1', name: 'pulumi-lora', type: 'lora', base_model_id: 'llm-1' },
    { id: 'lora-2', name: 'other-lora', type: 'lora', base_model_id: 'llm-2' },
    {
      id: 'ntk-1',
      name: 'iac-house-style-ntk-v3',
      type: 'ntk_controller',
      base_model_id: 'llm-1',
    },
    { id: 'skl-1', name: 'classical', type: 'sklearn' },
  ];

  const clickCatalogSource = async (wrapper: W) => {
    await findButton(wrapper, 'From catalog')!.trigger('click');
    await flushPromises();
  };

  // Catalog-mode Selects: [0] base LLM, [1] adapter, [2] dtype.
  const catalogSelects = (wrapper: W) =>
    wrapper.findAllComponents({ name: 'Select' });
  const itemValues = (select: ReturnType<W['findComponent']>) =>
    select.findAll('[data-value]').map((el) => el.attributes('data-value'));

  it('catalog source loads the catalog lazily and lists only LLM rows with hf_model_id as bases', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    // HF source is the default: nothing fetched yet, HF input still present.
    expect(getModels).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Hugging Face model ID');

    await clickCatalogSource(wrapper);
    expect(getModels).toHaveBeenCalledWith({ limit: 200 });
    expect(wrapper.text()).not.toContain('Hugging Face model ID');
    expect(wrapper.text()).toContain('Base LLM');

    expect(itemValues(catalogSelects(wrapper)[0])).toEqual(['llm-1', 'llm-2']);
    // No base picked yet → no adapters offered.
    expect(itemValues(catalogSelects(wrapper)[1])).toEqual([]);
  });

  it('adapter picker lists lora and ntk_controller rows whose base_model_id matches the chosen base, with the kind as suffix', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await clickCatalogSource(wrapper);

    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-1');
    await flushPromises();
    expect(itemValues(catalogSelects(wrapper)[1])).toEqual([
      '__none__',
      'lora-1',
      'ntk-1',
    ]);
    // The stubbed useI18n echoes keys, so the suffix renders as its key.
    const items = catalogSelects(wrapper)[1]
      .findAll('[data-value]')
      .map((el) => el.text().replace(/\s+/g, ' '));
    expect(items).toContain('pulumi-lora (label.adapter_kind_lora)');
    expect(items).toContain('iac-house-style-ntk-v3 (label.adapter_kind_ntk)');

    // Switching base drops an adapter that no longer belongs to it.
    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'lora-1');
    await flushPromises();
    expect(wrapper.text()).toContain('Max LoRA rank');
    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-2');
    await flushPromises();
    expect(itemValues(catalogSelects(wrapper)[1])).toEqual([
      '__none__',
      'lora-2',
    ]);
    expect(wrapper.text()).not.toContain('Max LoRA rank');
  });

  it('catalog payload: model_id + lora_model_ids + max_lora_rank, never hf_model_id', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await clickCatalogSource(wrapper);

    expect(findButton(wrapper, 'Serve')!.attributes('disabled')).toBeDefined();
    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-1');
    await flushPromises();
    expect(
      findButton(wrapper, 'Serve')!.attributes('disabled'),
    ).toBeUndefined();

    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'lora-1');
    await flushPromises();
    expect(wrapper.text()).toContain('hint.serve_adapter_lora');
    // With a LoRA adapter chosen the inputs are: [0] max_lora_rank,
    // [1] isvc_name
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('64');
    await flushPromises();

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toEqual({
      model_id: 'llm-1',
      lora_model_ids: ['lora-1'],
      max_lora_rank: 64,
      // Derived from the adapter's name once one is chosen.
      isvc_name: 'pulumi-lora-serving',
    });
    expect(body).not.toHaveProperty('hf_model_id');
    expect(body).not.toHaveProperty('llm_adapter');
  });

  it('catalog payload for an NTK controller: model_id + llm_adapter only, no LoRA keys and no rank input', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await clickCatalogSource(wrapper);

    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-1');
    await flushPromises();
    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'ntk-1');
    await flushPromises();

    // The exact path has no rank knob.
    expect(wrapper.text()).not.toContain('Max LoRA rank');
    expect(wrapper.text()).toContain('hint.serve_adapter_ntk');
    // Inputs: [0] isvc_name — derived from the controller's name.
    const inputs = wrapper.findAll('input');
    expect((inputs[0].element as HTMLInputElement).value).toBe(
      'iac-house-style-ntk-v3-serving',
    );

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toEqual({
      model_id: 'llm-1',
      llm_adapter: { kind: 'ntk_model', adapter_model_id: 'ntk-1' },
      isvc_name: 'iac-house-style-ntk-v3-serving',
    });
    expect(body).not.toHaveProperty('hf_model_id');
    expect(body).not.toHaveProperty('lora_model_ids');
    expect(body).not.toHaveProperty('max_lora_rank');
  });

  it('switching a LoRA adapter for an NTK controller drops the LoRA keys (never both)', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await clickCatalogSource(wrapper);

    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-1');
    await flushPromises();
    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'lora-1');
    await flushPromises();
    await wrapper.findAll('input')[0].setValue('64');
    await flushPromises();

    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'ntk-1');
    await flushPromises();
    expect(wrapper.text()).not.toContain('Max LoRA rank');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body.llm_adapter).toEqual({
      kind: 'ntk_model',
      adapter_model_id: 'ntk-1',
    });
    expect(body).not.toHaveProperty('lora_model_ids');
    expect(body).not.toHaveProperty('max_lora_rank');

    // And back to the LoRA adapter: llm_adapter must go away again.
    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'lora-1');
    await flushPromises();
    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();
    const [body2] = postModelServing.mock.calls[1];
    expect(body2.lora_model_ids).toEqual(['lora-1']);
    expect(body2).not.toHaveProperty('llm_adapter');
  });

  it('adapter-derived service name never overwrites a user-typed one', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await clickCatalogSource(wrapper);

    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-1');
    await flushPromises();
    // Base-derived first; the user then types their own.
    const isvc = () => wrapper.findAll('input')[0];
    expect((isvc().element as HTMLInputElement).value).toBe(
      'qwen-coder-serving',
    );
    await isvc().setValue('mine');
    await flushPromises();

    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'ntk-1');
    await flushPromises();
    expect((isvc().element as HTMLInputElement).value).toBe('mine');

    // Clearing the typed name lets the derivation take over again, now from
    // the chosen adapter. (With a LoRA adapter the rank input comes first,
    // so the service name is input [1].)
    await isvc().setValue('');
    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'lora-1');
    await flushPromises();
    expect(
      (wrapper.findAll('input')[1].element as HTMLInputElement).value,
    ).toBe('pulumi-lora-serving');
  });

  it('catalog payload without an adapter sends model_id only (no lora keys)', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await clickCatalogSource(wrapper);

    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-2');
    await flushPromises();
    // User overrides the derived service name.
    const inputs = wrapper.findAll('input');
    expect((inputs[0].element as HTMLInputElement).value).toBe('llama-serving');
    await inputs[0].setValue('my-llama');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toEqual({ model_id: 'llm-2', isvc_name: 'my-llama' });
  });

  it('blocks Serve on an out-of-range max_lora_rank', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await clickCatalogSource(wrapper);
    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-1');
    await flushPromises();
    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'lora-1');
    await flushPromises();

    await wrapper.findAll('input')[0].setValue('1024');
    await flushPromises();
    expect(findButton(wrapper, 'Serve')!.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('between 1 and 512');

    await wrapper.findAll('input')[0].setValue('128');
    await flushPromises();
    expect(
      findButton(wrapper, 'Serve')!.attributes('disabled'),
    ).toBeUndefined();
  });

  it('catalog mode autofills from the base row hf_model_id', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await clickCatalogSource(wrapper);
    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-1');
    await flushPromises();

    // Inputs (no adapter): [0] isvc_name, [1] served_model_name, [2] concurrent_users
    await wrapper.findAll('input')[2].setValue('5');
    await flushPromises();
    await findButton(wrapper, 'Autofill')!.trigger('click');
    await flushPromises();

    expect(recommendModelServing).toHaveBeenCalledWith(
      expect.objectContaining({ hf_model_id: 'Qwen/7B', concurrent_users: 5 }),
      expect.anything(),
    );
  });

  it('switching back to the HF source sends hf_model_id only (no catalog leak)', async () => {
    getModels.mockResolvedValue({ data: catalogRows });
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await clickCatalogSource(wrapper);
    catalogSelects(wrapper)[0].vm.$emit('update:modelValue', 'llm-1');
    await flushPromises();
    catalogSelects(wrapper)[1].vm.$emit('update:modelValue', 'lora-1');
    await flushPromises();

    await findButton(wrapper, 'Hugging Face id')!.trigger('click');
    await flushPromises();
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Qwen/Qwen2.5-Coder-7B-Instruct');
    // The derived service name stays (it is a plain field the user can edit).
    await inputs[1].setValue('');
    await flushPromises();

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toEqual({ hf_model_id: 'Qwen/Qwen2.5-Coder-7B-Instruct' });
  });

  it('emits created + close after successful submit', async () => {
    const wrapper = mountDialog();
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('hp3');
    await inputs[1].setValue('uuid');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    expect(wrapper.emitted('created')).toBeTruthy();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('Cancel emits close without invoking API', async () => {
    const wrapper = mountDialog();
    await findButton(wrapper, 'Cancel')!.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(postModelServing).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Concurrent users + Autofill
  // ---------------------------------------------------------------------------

  // After clicking the LLM tab, visible inputs are:
  //   [0] hf_model_id, [1] isvc_name, [2] served_model_name,
  //   [3] concurrent_users, [4] hf_token, [5] max_model_len, [6] tensor_parallel_size
  const setupLlmAndAutofill = async (
    wrapper: W,
    concurrentUsers: string,
    hfModelId = 'Qwen/Qwen2.5-Coder-7B-Instruct',
  ) => {
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue(hfModelId);
    await inputs[3].setValue(concurrentUsers);
    await flushPromises();
    await findButton(wrapper, 'Autofill')!.trigger('click');
    await flushPromises();
  };

  it('Autofill button is disabled until hf_model_id is set AND concurrent_users is a positive number', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);

    expect(
      findButton(wrapper, 'Autofill')!.attributes('disabled'),
    ).toBeDefined();

    const inputs = wrapper.findAll('input');

    // concurrent_users alone (without hf_model_id) leaves Autofill disabled.
    await inputs[3].setValue('5');
    await flushPromises();
    expect(
      findButton(wrapper, 'Autofill')!.attributes('disabled'),
    ).toBeDefined();

    // hf_model_id alone (without a positive concurrent_users) also leaves it disabled.
    await inputs[3].setValue('');
    await inputs[0].setValue('Qwen/Qwen2.5-Coder-7B-Instruct');
    await flushPromises();
    expect(
      findButton(wrapper, 'Autofill')!.attributes('disabled'),
    ).toBeDefined();

    // 0 is not positive — still disabled
    await inputs[3].setValue('0');
    await flushPromises();
    expect(
      findButton(wrapper, 'Autofill')!.attributes('disabled'),
    ).toBeDefined();

    // Both inputs valid → button enables.
    await inputs[3].setValue('5');
    await flushPromises();
    expect(
      findButton(wrapper, 'Autofill')!.attributes('disabled'),
    ).toBeUndefined();
  });

  it('Autofill does nothing when clicked with an empty / invalid value (defensive)', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);

    // Triggering the click bypasses the disabled attribute in jsdom, but the
    // handler itself guards against non-numeric / non-positive input.
    await findButton(wrapper, 'Autofill')!.trigger('click');
    await flushPromises();

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Qwen/Qwen2.5-Coder-7B-Instruct');
    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toEqual({ hf_model_id: 'Qwen/Qwen2.5-Coder-7B-Instruct' });
    expect(body.resources).toBeUndefined();
    expect(body.dtype).toBeUndefined();
  });

  it('Autofill <=10 users applies tier-1 model settings and resources', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '5');

    // Verify the populated inputs render the new values.
    const inputs = wrapper.findAll('input');
    expect((inputs[5].element as HTMLInputElement).value).toBe('4096');
    expect((inputs[6].element as HTMLInputElement).value).toBe('1');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toMatchObject({
      hf_model_id: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      dtype: 'bfloat16',
      max_model_len: 4096,
      tensor_parallel_size: 1,
      resources: {
        requests: { cpu: '4', memory: '16Gi', 'nvidia.com/gpu': '1' },
        limits: { cpu: '8', memory: '32Gi', 'nvidia.com/gpu': '1' },
      },
    });
  });

  it('Autofill boundary at 10 still applies tier-1 (<=10 inclusive)', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '10');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toMatchObject({
      tensor_parallel_size: 1,
      resources: {
        requests: { cpu: '4', memory: '16Gi', 'nvidia.com/gpu': '1' },
        limits: { cpu: '8', memory: '32Gi', 'nvidia.com/gpu': '1' },
      },
    });
  });

  it('Autofill 11-50 users applies tier-2 settings', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '25');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toMatchObject({
      tensor_parallel_size: 2,
      max_model_len: 4096,
      dtype: 'bfloat16',
      resources: {
        requests: { cpu: '8', memory: '32Gi', 'nvidia.com/gpu': '2' },
        limits: { cpu: '16', memory: '64Gi', 'nvidia.com/gpu': '2' },
      },
    });
  });

  it('Autofill 51-100 users applies tier-3 settings', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '100');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toMatchObject({
      tensor_parallel_size: 4,
      resources: {
        requests: { cpu: '16', memory: '64Gi', 'nvidia.com/gpu': '4' },
        limits: { cpu: '32', memory: '128Gi', 'nvidia.com/gpu': '4' },
      },
    });
  });

  it('Autofill >100 users applies tier-4 settings', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '500');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toMatchObject({
      tensor_parallel_size: 8,
      resources: {
        requests: { cpu: '32', memory: '128Gi', 'nvidia.com/gpu': '8' },
        limits: { cpu: '64', memory: '256Gi', 'nvidia.com/gpu': '8' },
      },
    });
  });

  it('Autofilled payload never includes tolerations or concurrent_users', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '25');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body.tolerations).toBeUndefined();
    expect(body.concurrent_users).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Recommendation API integration (success + 409 conflict)
  // ---------------------------------------------------------------------------

  it('applies recommendation from API response (throughput profile) instead of local fallback', async () => {
    recommendModelServing.mockResolvedValueOnce({
      status_code: 200,
      message: 'LLM serving config recommendation generated.',
      data: {
        recommendations: [
          {
            profile: 'throughput',
            max_model_len: 8192,
            dtype: 'float16',
            tensor_parallel_size: 2,
            resources: {
              requests: { cpu: '6', memory: '50Gi', 'nvidia.com/gpu': '2' },
              limits: { cpu: '6', memory: '50Gi', 'nvidia.com/gpu': '2' },
            },
            min_replicas: 1,
            max_replicas: 1,
          },
        ],
      },
    });

    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    // 5 users would map to tier-1 locally (tp=1, cpu=4, 16Gi/32Gi); the API
    // values above must win.
    await setupLlmAndAutofill(wrapper, '5');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toMatchObject({
      dtype: 'float16',
      max_model_len: 8192,
      tensor_parallel_size: 2,
      resources: {
        requests: { cpu: '6', memory: '50Gi', 'nvidia.com/gpu': '2' },
        limits: { cpu: '6', memory: '50Gi', 'nvidia.com/gpu': '2' },
      },
    });
  });

  it('prefers the throughput profile when multiple recommendations are returned', async () => {
    recommendModelServing.mockResolvedValueOnce({
      data: {
        recommendations: [
          {
            profile: 'balanced',
            max_model_len: 2048,
            dtype: 'bfloat16',
            tensor_parallel_size: 4,
            resources: {
              requests: { cpu: '2', memory: '8Gi', 'nvidia.com/gpu': '1' },
              limits: { cpu: '2', memory: '8Gi', 'nvidia.com/gpu': '1' },
            },
          },
          {
            profile: 'throughput',
            max_model_len: 4096,
            dtype: 'bfloat16',
            tensor_parallel_size: 1,
            resources: {
              requests: { cpu: '4', memory: '50Gi', 'nvidia.com/gpu': '1' },
              limits: { cpu: '4', memory: '50Gi', 'nvidia.com/gpu': '1' },
            },
          },
        ],
      },
    });

    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '5');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toMatchObject({
      max_model_len: 4096,
      tensor_parallel_size: 1,
      resources: {
        requests: { cpu: '4', memory: '50Gi', 'nvidia.com/gpu': '1' },
      },
    });
  });

  it('displays 409 detail.message inline below Concurrent users and does NOT autofill', async () => {
    const conflictMsg =
      'No configuration fits on any node for 35.0B-param model. At preferred (quantization=none) tp=1 each GPU would need 65.4 GiB.';

    recommendModelServing.mockImplementationOnce(async (_data, options) => {
      options?.onConflict?.(conflictMsg);
      return null;
    });

    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '5');

    // The conflict message renders verbatim under the Concurrent users field.
    expect(wrapper.text()).toContain(conflictMsg);
    // The helper hint is replaced (the autofill error <p> renders v-else).
    expect(wrapper.text()).not.toContain(
      'Enter HF Model ID and expected concurrent users',
    );

    // Local fallback must NOT have been applied: max_model_len / tensor_parallel_size
    // inputs remain empty.
    const inputs = wrapper.findAll('input');
    expect((inputs[5].element as HTMLInputElement).value).toBe('');
    expect((inputs[6].element as HTMLInputElement).value).toBe('');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toEqual({ hf_model_id: 'Qwen/Qwen2.5-Coder-7B-Instruct' });
    expect(body.resources).toBeUndefined();
    expect(body.dtype).toBeUndefined();
  });

  it('clears the 409 error message on the next autofill click', async () => {
    const conflictMsg = 'No configuration fits on any node.';

    recommendModelServing
      .mockImplementationOnce(async (_data, options) => {
        options?.onConflict?.(conflictMsg);
        return null;
      })
      .mockResolvedValueOnce(null);

    const wrapper = mountDialog();
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '5');
    expect(wrapper.text()).toContain(conflictMsg);

    // Second autofill resolves cleanly — the error message must disappear.
    await findButton(wrapper, 'Autofill')!.trigger('click');
    await flushPromises();
    expect(wrapper.text()).not.toContain(conflictMsg);
    expect(wrapper.text()).toContain(
      'Enter HF Model ID and expected concurrent users',
    );
  });

  it('clears the 409 error when the dialog is closed and reopened', async () => {
    const conflictMsg = 'No configuration fits on any node.';

    recommendModelServing.mockImplementationOnce(async (_data, options) => {
      options?.onConflict?.(conflictMsg);
      return null;
    });

    const wrapper = mountDialog(true);
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '5');
    expect(wrapper.text()).toContain(conflictMsg);

    await wrapper.setProps({ open: false });
    await flushPromises();
    await wrapper.setProps({ open: true });
    await flushPromises();
    await clickLlmTab(wrapper);

    expect(wrapper.text()).not.toContain(conflictMsg);
  });

  it('reopening the dialog resets concurrent_users and autofill', async () => {
    const wrapper = mountDialog(true);
    await clickLlmTab(wrapper);
    await setupLlmAndAutofill(wrapper, '500');

    // Close and reopen the dialog
    await wrapper.setProps({ open: false });
    await flushPromises();
    await wrapper.setProps({ open: true });
    await flushPromises();
    await clickLlmTab(wrapper);

    // Autofill is back to disabled (state reset)
    expect(
      findButton(wrapper, 'Autofill')!.attributes('disabled'),
    ).toBeDefined();

    // Concurrent users input is empty
    const inputs = wrapper.findAll('input');
    expect((inputs[3].element as HTMLInputElement).value).toBe('');

    // Submit with hf_model_id only — resources/dtype should not leak from previous fill
    await inputs[0].setValue('Qwen/Qwen2.5-Coder-7B-Instruct');
    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toEqual({ hf_model_id: 'Qwen/Qwen2.5-Coder-7B-Instruct' });
  });
});
