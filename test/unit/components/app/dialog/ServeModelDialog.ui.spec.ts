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
    expect(wrapper.text()).toContain('Resources');
    expect(wrapper.text()).toContain('Tolerations');

    expect(findButton(wrapper, 'Serve')!.attributes('disabled')).toBeDefined();

    // Input order: [0] hf_model_id, [1] isvc_name, [2] served_model_name
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Qwen/Qwen2.5-Coder-7B-Instruct');
    await flushPromises();
    expect(
      findButton(wrapper, 'Serve')!.attributes('disabled'),
    ).toBeUndefined();
  });

  it('submits LLM minimum payload (only hf_model_id + default tolerations)', async () => {
    const wrapper = mountDialog();
    await clickLlmTab(wrapper);

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Qwen/Qwen2.5-Coder-7B-Instruct');

    await findButton(wrapper, 'Serve')!.trigger('click');
    await flushPromises();

    const [body] = postModelServing.mock.calls[0];
    expect(body).toEqual({
      hf_model_id: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      tolerations: [
        {
          key: 'storage-type',
          operator: 'Equal',
          value: 'local',
          effect: 'NoSchedule',
        },
      ],
    });
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
});
