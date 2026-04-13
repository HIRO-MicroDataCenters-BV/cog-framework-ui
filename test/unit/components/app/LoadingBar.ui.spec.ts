import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingBar from '~/components/app/LoadingBar.vue';

describe('LoadingBar component', () => {
  it('is hidden by default', () => {
    const wrapper = mount(LoadingBar);
    expect(wrapper.find('.loading-bar').exists()).toBe(false);
  });

  it('renders loading indicator when isLoading is true', () => {
    const wrapper = mount(LoadingBar, {
      props: { isLoading: true },
    });
    expect(wrapper.find('.loading-bar').exists()).toBe(true);
  });
});
