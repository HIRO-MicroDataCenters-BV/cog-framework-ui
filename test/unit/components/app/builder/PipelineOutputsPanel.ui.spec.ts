import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PipelineOutputsPanel from '~/components/app/builder/PipelineOutputsPanel.vue';

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(PipelineOutputsPanel, {
    props: {
      outputs: [],
      allNodes: [
        {
          id: 'n1',
          data: {
            label: 'CompA',
            component: {
              output_path: [{ name: 'out1', type: 'string' }],
            },
          },
        },
      ],
      readonly: false,
      ...props,
    },
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        Icon: true,
        Input: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template:
            '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        },
        Select: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template:
            '<div><button data-test="pick-component" @click="$emit(\'update:modelValue\', \'CompA\')" /><button data-test="pick-output" @click="$emit(\'update:modelValue\', \'out1\')" /><slot /></div>',
        },
        SelectTrigger: { template: '<div><slot /></div>' },
        SelectValue: { template: '<div><slot /></div>' },
        SelectContent: { template: '<div><slot /></div>' },
        SelectItem: { template: '<div><slot /></div>' },
        Button: {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });

describe('PipelineOutputsPanel component', () => {
  it('adds placeholder output when add button is clicked', async () => {
    const wrapper = mountPanel();

    const addBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('builder.add_output'));
    expect(addBtn).toBeTruthy();
    await addBtn!.trigger('click');

    expect(wrapper.emitted('update:outputs')?.[0]?.[0]).toEqual([
      {
        name: 'output_1',
        source: {
          component_name: '',
          output_name: '',
        },
      },
    ]);
  });

  it('deletes output row when delete is clicked', async () => {
    const wrapper = mountPanel({
      outputs: [
        {
          name: 'output_1',
          source: {
            component_name: 'CompA',
            output_name: 'out1',
          },
        },
      ],
    });

    const buttons = wrapper.findAll('button');
    const deleteBtn = buttons[buttons.length - 1];
    await deleteBtn.trigger('click');

    expect(wrapper.emitted('update:outputs')?.[0]?.[0]).toEqual([]);
  });
});
