import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DeleteConfirmationDialog from '~/components/app/builder/DeleteConfirmationDialog.vue';

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(DeleteConfirmationDialog, {
    props: {
      open: true,
      componentName: 'Feature Builder',
      dependencies: ['NodeA', 'NodeB'],
      ...props,
    },
    global: {
      mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
          params?.name ? `${key}:${params.name}` : key,
      },
      stubs: {
        Icon: true,
        AlertDialog: { template: '<div><slot /></div>' },
        AlertDialogContent: { template: '<div><slot /></div>' },
        AlertDialogHeader: { template: '<div><slot /></div>' },
        AlertDialogTitle: { template: '<h3><slot /></h3>' },
        AlertDialogDescription: { template: '<div><slot /></div>' },
        AlertDialogFooter: { template: '<div><slot /></div>' },
        AlertDialogCancel: {
          template:
            '<button data-test="cancel" @click="$emit(\'click\')"><slot /></button>',
        },
        AlertDialogAction: {
          template:
            '<button data-test="confirm" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });

describe('DeleteConfirmationDialog component', () => {
  it('emits cancel and confirm actions', async () => {
    const wrapper = mountDialog();

    await wrapper.find('[data-test="cancel"]').trigger('click');
    await wrapper.find('[data-test="confirm"]').trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('renders dependency list when provided', () => {
    const wrapper = mountDialog();
    expect(wrapper.text()).toContain('NodeA');
    expect(wrapper.text()).toContain('NodeB');
  });
});
