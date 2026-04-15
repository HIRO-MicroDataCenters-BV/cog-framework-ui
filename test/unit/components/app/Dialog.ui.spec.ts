import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Dialog from '~/components/app/Dialog.vue';

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(Dialog, {
    props: {
      open: true,
      title: 'My Dialog',
      navigation: ['type', 'metadata'],
      actions: ['cancel', 'next'],
      ...props,
    },
    slots: {
      default: '<div>Body</div>',
    },
    global: {
      stubs: {
        Dialog: {
          template:
            '<div><button data-test="close" @click="$emit(\'update:open\', false)" /><slot /></div>',
        },
        DialogContent: { template: '<div><slot /></div>' },
        DialogHeader: { template: '<div><slot /></div>' },
        DialogTitle: { template: '<div><slot /></div>' },
        DialogFooter: { template: '<div><slot /></div>' },
        SidebarProvider: { template: '<div><slot /></div>' },
        Sidebar: { template: '<div><slot /></div>' },
        SidebarHeader: { template: '<div><slot /></div>' },
        SidebarContent: { template: '<div><slot /></div>' },
        SidebarGroup: { template: '<div><slot /></div>' },
        SidebarMenu: { template: '<div><slot /></div>' },
        SidebarMenuItem: { template: '<div><slot /></div>' },
        SidebarMenuSubButton: { template: '<div><slot /></div>' },
        SidebarInset: { template: '<div><slot /></div>' },
        Button: {
          template:
            '<button @click="$emit(\'click\')" :data-action="$attrs[\'data-action\']"><slot /></button>',
        },
        Icon: { template: '<i />' },
      },
    },
  });

describe('Dialog component', () => {
  it('emits on-close when root dialog is closed', async () => {
    const wrapper = mountDialog();
    await wrapper.find('[data-test="close"]').trigger('click');

    expect(wrapper.emitted('on-close')?.[0]).toEqual([false]);
  });

  it('handles next action by advancing step and emitting on-set-step', async () => {
    const wrapper = mountDialog();

    const nextButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'action.next');
    expect(nextButton).toBeTruthy();
    await nextButton!.trigger('click');

    expect(wrapper.emitted('on-action')?.[0]).toEqual(['next']);
    expect(wrapper.emitted('on-set-step')?.[0]).toEqual([1]);
  });
});
