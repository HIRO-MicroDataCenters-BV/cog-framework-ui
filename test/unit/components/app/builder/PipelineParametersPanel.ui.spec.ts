import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PipelineParametersPanel from '~/components/app/builder/PipelineParametersPanel.vue';

const SelectStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="select-stub" :data-value="modelValue"><slot /></div>',
};

const stubs = {
  Button: {
    inheritAttrs: true,
    template: '<button type="button" v-bind="$attrs"><slot /></button>',
  },
  // Stub fires update:modelValue BEFORE input so v-model commits before
  // any @input handler reads editingParam state.
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
  SelectItem: { props: ['value'], template: '<div><slot /></div>' },
  Badge: { template: '<span class="badge"><slot /></span>' },
  Icon: { template: '<i />' },
  Tooltip: { template: '<span><slot /></span>' },
  TooltipTrigger: { template: '<span><slot /></span>' },
  TooltipContent: { template: '<span><slot /></span>' },
  // Hide all the AlertDialog scaffolding — these tests don't exercise delete.
  AlertDialog: { props: ['open'], template: '<div v-if="open"><slot /></div>' },
  AlertDialogContent: { template: '<div><slot /></div>' },
  AlertDialogHeader: { template: '<div><slot /></div>' },
  AlertDialogTitle: { template: '<h3><slot /></h3>' },
  AlertDialogDescription: { template: '<div><slot /></div>' },
  AlertDialogFooter: { template: '<div><slot /></div>' },
  AlertDialogCancel: { template: '<button><slot /></button>' },
  AlertDialogAction: { template: '<button><slot /></button>' },
  CreateParameterDialog: { template: '<div />' },
};

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(PipelineParametersPanel, {
    props: {
      parameters: [
        { name: 'p1', type: 'Integer', default: '1', description: '' },
      ],
      allNodes: [],
      readonly: false,
      ...props,
    },
    global: {
      stubs,
      mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
          params?.name ? `${key}:${String(params.name)}` : key,
      },
    },
  });

type W = ReturnType<typeof mountPanel>;

const findButtonByText = (wrapper: W, text: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(text))!;

const startEditing = async (wrapper: W) => {
  await findButtonByText(wrapper, 'action.edit').trigger('click');
  await flushPromises();
};

const setDefaultValue = async (wrapper: W, value: string) => {
  // Inputs in edit mode (in DOM order): [0] name, [1] default, [2] description
  const inputs = wrapper.findAll('input');
  await inputs[1].setValue(value);
  await flushPromises();
};

const setType = async (wrapper: W, type: string) => {
  const select = wrapper.findComponent(SelectStub);
  await select.vm.$emit('update:modelValue', type);
  await flushPromises();
};

const findSaveButton = (wrapper: W) => findButtonByText(wrapper, 'action.save');

describe('PipelineParametersPanel — edit-time validation', () => {
  it('Save is enabled when editing a parameter that already has a valid default', async () => {
    const wrapper = mountPanel();
    await startEditing(wrapper);

    expect(wrapper.text()).not.toContain('validation.input.constant_integer');
    expect(findSaveButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('shows "must be an integer" when the default becomes a float on an Integer param', async () => {
    const wrapper = mountPanel();
    await startEditing(wrapper);
    await setDefaultValue(wrapper, '1.0');

    expect(wrapper.text()).toContain('validation.input.constant_integer');
    expect(findSaveButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('clears the error and re-enables Save once the default is valid again', async () => {
    const wrapper = mountPanel();
    await startEditing(wrapper);
    await setDefaultValue(wrapper, '1.0');
    expect(wrapper.text()).toContain('validation.input.constant_integer');

    await setDefaultValue(wrapper, '2');
    expect(wrapper.text()).not.toContain('validation.input.constant_integer');
    expect(findSaveButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('re-validates when the type changes (Integer→Float on an integer-only default still passes; Float→Integer with "1.5" fails)', async () => {
    const wrapper = mountPanel({
      parameters: [
        { name: 'p1', type: 'Float', default: '1.5', description: '' },
      ],
    });
    await startEditing(wrapper);

    // Float + 1.5 → no error.
    expect(wrapper.text()).not.toContain('validation.input.constant_integer');

    // Switch to Integer — same value, stricter type.
    await setType(wrapper, 'Integer');
    expect(wrapper.text()).toContain('validation.input.constant_integer');
    expect(findSaveButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('does NOT emit update:parameters when Save is clicked with an invalid default', async () => {
    const wrapper = mountPanel();
    await startEditing(wrapper);
    await setDefaultValue(wrapper, '1.0');
    await findSaveButton(wrapper).trigger('click');

    expect(wrapper.emitted('update:parameters')).toBeFalsy();
  });

  it('emits update:parameters with the edited values when Save is clicked with a valid default', async () => {
    const wrapper = mountPanel();
    await startEditing(wrapper);
    await setDefaultValue(wrapper, '99');
    await findSaveButton(wrapper).trigger('click');

    const events = wrapper.emitted('update:parameters');
    expect(events).toBeTruthy();
    expect(events![0][0]).toMatchObject([
      { name: 'p1', type: 'Integer', default: '99' },
    ]);
  });

  it('Cancel clears any pending validation error and exits edit mode', async () => {
    const wrapper = mountPanel();
    await startEditing(wrapper);
    await setDefaultValue(wrapper, '1.0');
    expect(wrapper.text()).toContain('validation.input.constant_integer');

    await findButtonByText(wrapper, 'action.cancel').trigger('click');
    await flushPromises();

    expect(wrapper.text()).not.toContain('validation.input.constant_integer');
    // Edit mode exited — Edit button is back, Save/Cancel are gone.
    expect(
      wrapper.findAll('button').some((b) => b.text().includes('action.edit')),
    ).toBe(true);
    expect(
      wrapper.findAll('button').some((b) => b.text().includes('action.save')),
    ).toBe(false);
  });

  it('treats an empty default as valid (default is optional)', async () => {
    const wrapper = mountPanel();
    await startEditing(wrapper);
    await setDefaultValue(wrapper, '');

    expect(wrapper.text()).not.toContain('validation.input.constant_integer');
    expect(findSaveButton(wrapper).attributes('disabled')).toBeUndefined();
  });
});
