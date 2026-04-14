import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Breadcrumb from '~/components/app/Breadcrumb.vue';

describe('Breadcrumb component', () => {
  it('renders placeholder container', () => {
    const wrapper = mount(Breadcrumb);
    expect(wrapper.find('div').exists()).toBe(true);
    expect(wrapper.text()).toBe('');
  });
});
