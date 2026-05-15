import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ServeModelDialog from '~/components/app/dialog/ServeModelDialog.vue';

const postModelServing = vi.fn();

vi.mock('@/composables/api', () => ({
  useApi: () => ({ postModelServing }),
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
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="select-stub"><slot /></div>',
  },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<span><slot /></span>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: {
    props: ['value'],
    template: '<div><slot /></div>',
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

  it('Autofill button is disabled until concurrent_users is a positive number', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);

    expect(
      findButton(wrapper, 'Autofill')!.attributes('disabled'),
    ).toBeDefined();

    const inputs = wrapper.findAll('input');
    // 0 is not positive — still disabled
    await inputs[3].setValue('0');
    await flushPromises();
    expect(
      findButton(wrapper, 'Autofill')!.attributes('disabled'),
    ).toBeDefined();

    // A positive integer enables the button
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
