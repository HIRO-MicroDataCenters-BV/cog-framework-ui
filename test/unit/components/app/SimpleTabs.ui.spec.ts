import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SimpleTabs from '~/components/app/SimpleTabs.vue';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'files', label: 'Files' },
];

describe('SimpleTabs component', () => {
  it('renders tabs and active state from modelValue', () => {
    const wrapper = mount(SimpleTabs, {
      props: {
        tabs,
        modelValue: 'files',
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[1].classes()).toContain('border-primary');
  });

  it('emits update:modelValue on tab click', async () => {
    const wrapper = mount(SimpleTabs, {
      props: {
        tabs,
        modelValue: 'all',
      },
    });

    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['files']);
  });

  it('can hide border when showBorder is false', () => {
    const wrapper = mount(SimpleTabs, {
      props: {
        tabs,
        modelValue: 'all',
        showBorder: false,
      },
    });

    expect(wrapper.classes()).not.toContain('border-b');
  });
});
