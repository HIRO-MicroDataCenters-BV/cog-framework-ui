import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Actions from '~/components/app/menu/Actions.vue';

const tMock = (key: string, params?: Record<string, unknown>) =>
  params?.name ? `${key}:${String(params.name)}` : key;

const globalStubs = {
  DropdownMenu: { template: '<div><slot /></div>' },
  DropdownMenuTrigger: { template: '<div><slot /></div>' },
  DropdownMenuContent: { template: '<div><slot /></div>' },
  DropdownMenuSeparator: { template: '<div />' },
  DropdownMenuItem: {
    template:
      '<button data-test="menu-item" @click="$emit(\'click\')"><slot /></button>',
  },
  AlertDialog: {
    template:
      '<div><button data-test="close-dialog" @click="$emit(\'update:open\', false)" /><slot /></div>',
  },
  AlertDialogContent: { template: '<div><slot /></div>' },
  AlertDialogHeader: { template: '<div><slot /></div>' },
  AlertDialogTitle: { template: '<div><slot /></div>' },
  AlertDialogDescription: { template: '<div><slot /></div>' },
  AlertDialogFooter: { template: '<div><slot /></div>' },
  AlertDialogCancel: {
    template:
      '<button data-test="cancel-dialog" @click="$emit(\'click\')"><slot /></button>',
  },
  AlertDialogAction: {
    template:
      '<button data-test="confirm-dialog" @click="$emit(\'click\')"><slot /></button>',
  },
  Button: { template: '<button><slot /></button>' },
  Icon: { template: '<i />' },
};

describe('Actions menu confirmation dialog', () => {
  const buildWrapper = (items?: Array<Record<string, unknown>>) =>
    mount(Actions, {
      props: {
        id: '1',
        title: 'Test Resource',
        items: items || [
          {
            key: 'delete_model',
            label: 'delete_model',
            hasConfirmation: true,
            action: vi.fn(),
          },
          {
            key: 'delete',
            label: 'delete',
            hasConfirmation: true,
            action: vi.fn(),
          },
        ],
      },
      global: {
        stubs: globalStubs,
        mocks: { $t: tMock },
      },
    });

  it('uses action-specific alert key for delete_model', async () => {
    const wrapper = buildWrapper();

    const items = wrapper.findAll('[data-test="menu-item"]');
    await items[0].trigger('click');

    expect(wrapper.text()).toContain('alert.delete_model:Test Resource');
  });

  it('clears pending action when dialog closes', async () => {
    const wrapper = buildWrapper();

    const items = wrapper.findAll('[data-test="menu-item"]');

    // Open with delete_model first.
    await items[0].trigger('click');
    expect(wrapper.text()).toContain('alert.delete_model:Test Resource');

    // Simulate overlay/escape close via update:open(false).
    await wrapper.find('[data-test="close-dialog"]').trigger('click');

    // Re-open with dataset delete and ensure stale model text is gone.
    await items[1].trigger('click');
    expect(wrapper.text()).toContain('alert.delete_dataset:Test Resource');
    expect(wrapper.text()).not.toContain('alert.delete_model:Test Resource');
  });

  it('uses action-specific key for delete_model_service', async () => {
    const wrapper = buildWrapper([
      {
        key: 'delete_model_service',
        label: 'delete_model_service',
        hasConfirmation: true,
        action: vi.fn(),
      },
    ]);

    await wrapper.find('[data-test="menu-item"]').trigger('click');
    expect(wrapper.text()).toContain(
      'alert.delete_model_service:Test Resource',
    );
  });

  it('falls back to generic delete alert for unknown delete action key', async () => {
    const wrapper = buildWrapper([
      {
        key: 'delete_custom_resource',
        label: 'delete_custom_resource',
        hasConfirmation: true,
        action: vi.fn(),
      },
    ]);

    await wrapper.find('[data-test="menu-item"]').trigger('click');
    expect(wrapper.text()).toContain('alert.delete_resource:Test Resource');
  });

  it('executes non-confirm action immediately', async () => {
    const actionSpy = vi.fn();
    const wrapper = buildWrapper([
      {
        key: 'preview',
        label: 'preview',
        hasConfirmation: false,
        action: actionSpy,
      },
    ]);

    await wrapper.find('[data-test="menu-item"]').trigger('click');
    expect(actionSpy).toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('alert.delete_dataset:Test Resource');
  });
});
