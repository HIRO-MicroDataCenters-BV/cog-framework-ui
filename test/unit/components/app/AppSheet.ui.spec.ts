import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppSheet from '~/components/app/AppSheet.vue';

const mountAppSheet = (props: Record<string, unknown> = {}) =>
  mount(AppSheet, {
    props: {
      open: true,
      title: 'Sheet title',
      description: 'Sheet description',
      ...props,
    },
    slots: {
      default: '<div data-test="body">Body slot</div>',
      footer: '<div data-test="footer">Footer slot</div>',
    },
    global: {
      stubs: {
        Sheet: {
          template:
            '<div><button data-test="close" @click="$emit(\'update:open\', false)" /><slot /></div>',
        },
        SheetContent: {
          template: '<section data-test="content"><slot /></section>',
        },
        SheetHeader: { template: '<header><slot /></header>' },
        SheetTitle: { template: '<h2><slot /></h2>' },
        SheetDescription: { template: '<p><slot /></p>' },
        SheetFooter: { template: '<footer><slot /></footer>' },
      },
    },
  });

describe('AppSheet component', () => {
  it('renders title, description and slots', () => {
    const wrapper = mountAppSheet();

    expect(wrapper.text()).toContain('Sheet title');
    expect(wrapper.text()).toContain('Sheet description');
    expect(wrapper.find('[data-test="body"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="footer"]').exists()).toBe(true);
  });

  it('emits update:open when sheet requests close', async () => {
    const wrapper = mountAppSheet();
    await wrapper.find('[data-test="close"]').trigger('click');

    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });
});
