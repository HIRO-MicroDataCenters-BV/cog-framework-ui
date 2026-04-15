import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CopyPaste from '~/components/app/CopyPaste.vue';

const copyMock = vi.fn();
const toasterShowMock = vi.fn();
const isSupportedRef = ref(true);

vi.mock('@vueuse/core', () => ({
  useClipboard: () => ({
    copy: copyMock,
    isSupported: isSupportedRef,
  }),
}));

vi.mock('@/composables/toaster', () => ({
  useToaster: () => ({
    show: toasterShowMock,
  }),
}));

describe('CopyPaste component', () => {
  beforeEach(() => {
    copyMock.mockReset();
    toasterShowMock.mockReset();
    isSupportedRef.value = true;
  });

  const mountCopyPaste = (
    props: Record<string, unknown> = {},
    slotText = 'hello',
  ) =>
    mount(CopyPaste, {
      props: {
        hasCopy: true,
        ...props,
      },
      slots: {
        default: slotText,
      },
      global: {
        stubs: {
          Icon: { template: '<i />' },
        },
      },
    });

  it('shows unsupported error when clipboard API is unavailable', async () => {
    isSupportedRef.value = false;
    const wrapper = mountCopyPaste();

    await wrapper.find('button').trigger('click');

    expect(toasterShowMock).toHaveBeenCalledWith(
      'error',
      'clipboard_not_supported',
    );
    expect(copyMock).not.toHaveBeenCalled();
  });

  it('shows nothing_to_copy when there is no text to copy', async () => {
    const wrapper = mountCopyPaste({}, '   ');

    await wrapper.find('button').trigger('click');

    expect(toasterShowMock).toHaveBeenCalledWith('error', 'nothing_to_copy');
    expect(copyMock).not.toHaveBeenCalled();
  });

  it('copies explicit copyText and shows success toast', async () => {
    copyMock.mockResolvedValue(undefined);
    const wrapper = mountCopyPaste({ copyText: 'explicit-value' }, 'ignored');

    await wrapper.find('button').trigger('click');

    expect(copyMock).toHaveBeenCalledWith('explicit-value');
    expect(toasterShowMock).toHaveBeenCalledWith(
      'success',
      'copied_to_clipboard',
    );
  });

  it('shows failed_to_copy toast when copy throws', async () => {
    copyMock.mockRejectedValue(new Error('copy failed'));
    const wrapper = mountCopyPaste({ copyText: 'text' });

    await wrapper.find('button').trigger('click');

    expect(toasterShowMock).toHaveBeenCalledWith('error', 'failed_to_copy');
  });
});
