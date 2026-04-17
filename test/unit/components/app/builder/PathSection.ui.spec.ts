import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PathSection from '~/components/app/builder/PathSection.vue';

vi.mock('~/composables/useBuilderColors', () => ({
  useBuilderColors: () => ({
    getTypeColor: () => '#000',
  }),
}));

vi.mock('~/composables/useBuilderIcons', () => ({
  useBuilderIcons: () => ({
    getTypeIcon: (type: string) => `icon:${type}`,
  }),
}));

const mountPathSection = (props: Record<string, unknown>) =>
  mount(PathSection, {
    props,
    global: {
      stubs: {
        Icon: true,
      },
    },
  });

describe('PathSection component', () => {
  it('renders path rows when paths are available', () => {
    const wrapper = mountPathSection({
      title: 'Outputs',
      paths: [{ key: 'k1', name: 'predictions', type: 'array' }],
    });

    expect(wrapper.text()).toContain('Outputs');
    expect(wrapper.text()).toContain('predictions');
    expect(wrapper.text()).toContain('array');
  });

  it('shows empty state when there are no paths', () => {
    const wrapper = mountPathSection({
      title: 'Outputs',
      paths: [],
    });

    expect(wrapper.text()).toContain('No outputs configured');
  });
});
