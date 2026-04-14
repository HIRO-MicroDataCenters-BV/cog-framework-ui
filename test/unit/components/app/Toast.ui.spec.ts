import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Toast from '~/components/app/Toast.vue';

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('vue-sonner', () => ({
  toast: toastMocks,
  Toaster: {
    name: 'Toaster',
    template: '<div />',
  },
}));

describe('Toast component', () => {
  beforeEach(() => {
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
    toastMocks.info.mockReset();
    toastMocks.warning.mockReset();
  });

  const mountToast = () =>
    mount(Toast, {
      global: {
        stubs: {
          Toaster: { template: '<div />' },
        },
      },
    });

  it('translates success keys and forwards toast options', () => {
    const wrapper = mountToast();
    (wrapper.vm as { success: (message: string) => void }).success(
      'success.saved',
    );

    expect(toastMocks.success).toHaveBeenCalledWith('success.saved', {
      description: '',
      duration: 4000,
    });
  });

  it('uses fallback translation key for unknown errors', () => {
    const wrapper = mountToast();
    (
      wrapper.vm as { error: (error: unknown, fallback?: string) => void }
    ).error({});

    expect(toastMocks.error).toHaveBeenCalledWith('error.unknown', {
      duration: 5000,
    });
  });
});
