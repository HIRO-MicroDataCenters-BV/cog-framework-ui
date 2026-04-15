import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Panel from '~/components/app/Panel.vue';

describe('Panel component', () => {
  it('renders title and default slot content', () => {
    const wrapper = mount(Panel, {
      props: {
        title: 'My Panel',
      },
      slots: {
        default: '<div data-test="content">Body</div>',
      },
    });

    expect(wrapper.text()).toContain('My Panel');
    expect(wrapper.find('[data-test="content"]').exists()).toBe(true);
  });

  it('renders actions slot only when provided', () => {
    const noActions = mount(Panel, {
      props: { title: 'No Actions' },
    });
    expect(noActions.find('[data-test="action"]').exists()).toBe(false);

    const withActions = mount(Panel, {
      props: { title: 'With Actions' },
      slots: {
        actions: '<button data-test="action">A</button>',
      },
    });
    expect(withActions.find('[data-test="action"]').exists()).toBe(true);
  });
});
