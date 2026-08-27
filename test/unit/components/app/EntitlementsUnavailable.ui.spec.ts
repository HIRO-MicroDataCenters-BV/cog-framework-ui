import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EntitlementsUnavailable from '~/components/app/EntitlementsUnavailable.vue';

const global = { stubs: { Icon: true } };

describe('EntitlementsUnavailable component', () => {
  it('explains the failure without implying a lower plan', () => {
    const wrapper = mount(EntitlementsUnavailable, { global });

    expect(wrapper.text()).toContain("Couldn't check your plan");
    // The whole point of this state: never assert the user is on a lower plan.
    // Naming Enterprise conditionally ("if your workspace is on...") is fine;
    // the upsell's phrasing and CTA are what must not appear.
    expect(wrapper.text()).not.toContain('available on the Enterprise plan');
    expect(wrapper.text()).not.toContain('is part of the Enterprise plan');
    expect(wrapper.text()).not.toContain('Try Enterprise Features');
    expect(wrapper.text()).not.toContain('upgrade');
  });

  it('emits retry when the button is clicked', async () => {
    const wrapper = mount(EntitlementsUnavailable, { global });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('disables the button and shows progress while retrying', async () => {
    const wrapper = mount(EntitlementsUnavailable, {
      props: { retrying: true },
      global,
    });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Retrying');

    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('retry')).toBeUndefined();
  });
});
