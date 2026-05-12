import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import CreateParameterDialog from '~/components/app/builder/CreateParameterDialog.vue';

const SelectStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="select-stub" :data-value="modelValue"><slot /></div>',
};

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
  // Stub fires update:modelValue BEFORE input so v-model commits before
  // any @input handler reads formData.* state.
  Input: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue', 'input'],
    template: '<input :value="modelValue" @input="handleInput" />',
    methods: {
      handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        this.$emit('update:modelValue', target.value);
        this.$emit('input', e);
      },
    },
  },
  Select: SelectStub,
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
};

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(CreateParameterDialog, {
    props: { open: true, existingParameters: [], ...props },
    global: {
      stubs,
      mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
          params?.name ? `${key}:${String(params.name)}` : key,
      },
    },
  });

type W = ReturnType<typeof mountDialog>;

const findCreateButton = (wrapper: W) =>
  wrapper.findAll('button').find((b) => b.text().trim() === 'action.create')!;

const setType = async (wrapper: W, type: string) => {
  const select = wrapper.findComponent(SelectStub);
  await select.vm.$emit('update:modelValue', type);
  await flushPromises();
};

const setName = async (wrapper: W, name: string) => {
  // Inputs in DOM order: [0] name, [1] default, [2] description
  await wrapper.findAll('input')[0].setValue(name);
  await flushPromises();
};

const setDefault = async (wrapper: W, value: string) => {
  await wrapper.findAll('input')[1].setValue(value);
  await flushPromises();
};

describe('CreateParameterDialog — default value validation', () => {
  it('Create is disabled until a valid name is provided', async () => {
    const wrapper = mountDialog();
    expect(findCreateButton(wrapper).attributes('disabled')).toBeDefined();

    await setName(wrapper, 'param1');
    expect(findCreateButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('shows "must be an integer" when Integer type is paired with a decimal default', async () => {
    const wrapper = mountDialog();
    await setName(wrapper, 'param1');
    await setType(wrapper, 'Integer');
    await setDefault(wrapper, '1.0');

    expect(wrapper.text()).toContain('validation.input.constant_integer');
    expect(findCreateButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('clears the integer error when the default becomes valid', async () => {
    const wrapper = mountDialog();
    await setName(wrapper, 'param1');
    await setType(wrapper, 'Integer');
    await setDefault(wrapper, '1.0');
    expect(wrapper.text()).toContain('validation.input.constant_integer');

    await setDefault(wrapper, '42');
    expect(wrapper.text()).not.toContain('validation.input.constant_integer');
    expect(findCreateButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('Float type accepts decimal defaults without error', async () => {
    const wrapper = mountDialog();
    await setName(wrapper, 'param1');
    await setType(wrapper, 'Float');
    await setDefault(wrapper, '1.5');

    expect(wrapper.text()).not.toContain('validation.input.constant_float');
    expect(findCreateButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('Boolean type rejects "yes" and accepts "true"', async () => {
    const wrapper = mountDialog();
    await setName(wrapper, 'param1');
    await setType(wrapper, 'Boolean');
    await setDefault(wrapper, 'yes');

    expect(wrapper.text()).toContain('validation.input.constant_boolean');
    expect(findCreateButton(wrapper).attributes('disabled')).toBeDefined();

    await setDefault(wrapper, 'true');
    expect(wrapper.text()).not.toContain('validation.input.constant_boolean');
    expect(findCreateButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('re-validates when the type changes (Float→Integer with "1.0" default)', async () => {
    const wrapper = mountDialog();
    await setName(wrapper, 'param1');
    await setType(wrapper, 'Float');
    await setDefault(wrapper, '1.0');
    expect(wrapper.text()).not.toContain('validation.input.constant_integer');

    // Same value, stricter type — error must surface immediately.
    await setType(wrapper, 'Integer');
    expect(wrapper.text()).toContain('validation.input.constant_integer');
    expect(findCreateButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('does not flag an empty default (default is optional)', async () => {
    const wrapper = mountDialog();
    await setName(wrapper, 'param1');
    await setType(wrapper, 'Integer');
    await setDefault(wrapper, '');

    expect(wrapper.text()).not.toContain('validation.input.constant_integer');
    expect(findCreateButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('emits create with the typed values when valid', async () => {
    const wrapper = mountDialog();
    await setName(wrapper, 'myParam');
    await setType(wrapper, 'Integer');
    await setDefault(wrapper, '42');
    await findCreateButton(wrapper).trigger('click');

    const events = wrapper.emitted('create');
    expect(events).toBeTruthy();
    expect(events![0][0]).toMatchObject({
      name: 'myParam',
      type: 'Integer',
      default: '42',
    });
  });

  it('does NOT emit create when the default value is invalid for the type', async () => {
    const wrapper = mountDialog();
    await setName(wrapper, 'myParam');
    await setType(wrapper, 'Integer');
    await setDefault(wrapper, '1.0');
    await findCreateButton(wrapper).trigger('click');

    expect(wrapper.emitted('create')).toBeFalsy();
  });
});
