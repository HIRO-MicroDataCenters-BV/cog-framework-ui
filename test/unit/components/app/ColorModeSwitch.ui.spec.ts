import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ColorModeSwitch from '~/components/app/ColorModeSwitch.vue';

const colorModeState = {
  value: 'dark',
  preference: 'dark',
};

globalThis.useColorMode = () => colorModeState;

describe('ColorModeSwitch component', () => {
  beforeEach(() => {
    colorModeState.value = 'dark';
    colorModeState.preference = 'dark';
  });

  it('shows light mode title when current mode is dark', () => {
    const wrapper = mount(ColorModeSwitch, {
      global: {
        stubs: { Icon: true, Button: true },
      },
    });

    expect(wrapper.attributes('title')).toBe('Light mode');
  });

  it('toggles theme from dark to light', async () => {
    const wrapper = mount(ColorModeSwitch, {
      global: {
        stubs: { Icon: true, Button: true },
      },
    });

    await wrapper.trigger('click');

    expect(colorModeState.value).toBe('light');
    expect(colorModeState.preference).toBe('light');
  });
});
