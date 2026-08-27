import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import EnterpriseContactDialog from '~/components/app/EnterpriseContactDialog.vue';

const copy = vi.fn();

// Partial mock: reka-ui (behind the shadcn Dialog) pulls in @vueuse/core too,
// so only useClipboard is swapped out.
vi.mock('@vueuse/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vueuse/core')>()),
  useClipboard: () => ({ copy, isSupported: { value: true } }),
}));

// The real dialog teleports its content out of the wrapper, so the primitives
// are stubbed as pass-throughs to assert on this component's own markup.
const passthrough = { template: '<div><slot /></div>' };
const global = {
  stubs: {
    Icon: true,
    Dialog: passthrough,
    DialogContent: passthrough,
    DialogHeader: passthrough,
    DialogFooter: passthrough,
    DialogTitle: passthrough,
    DialogDescription: passthrough,
  },
};

const mountDialog = () =>
  mount(EnterpriseContactDialog, {
    props: {
      featureName: 'The Infra Dashboard',
      contactEmail: 'admin@hiro-microdatacenters.com',
      open: true,
    },
    global,
  });

describe('EnterpriseContactDialog component', () => {
  it('names the feature and shows the contact address', () => {
    const wrapper = mountDialog();

    expect(wrapper.text()).toContain('Try Enterprise Features');
    expect(wrapper.text()).toContain(
      'The Infra Dashboard is part of the Enterprise plan',
    );
    expect(wrapper.text()).toContain('admin@hiro-microdatacenters.com');
  });

  it('builds a mailto link with the feature in the subject', () => {
    const wrapper = mountDialog();

    expect(wrapper.get('a[href^="mailto:"]').attributes('href')).toBe(
      'mailto:admin@hiro-microdatacenters.com' +
        '?subject=Enterprise%20access%20request%3A%20The%20Infra%20Dashboard',
    );
  });

  it('copies the address to the clipboard', async () => {
    copy.mockClear();
    const wrapper = mountDialog();

    await wrapper.get('button[title="Copy email address"]').trigger('click');

    expect(copy).toHaveBeenCalledWith('admin@hiro-microdatacenters.com');
  });
});
