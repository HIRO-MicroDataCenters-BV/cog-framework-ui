import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Content from '~/components/app/Content.vue';

describe('Content component', () => {
  it('renders slot content and keeps full-height container class', () => {
    const wrapper = mount(Content, {
      slots: {
        default: '<div data-test="body">Hello content</div>',
      },
    });

    expect(wrapper.classes()).toContain('h-full');
    expect(wrapper.find('[data-test="body"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Hello content');
  });
});
