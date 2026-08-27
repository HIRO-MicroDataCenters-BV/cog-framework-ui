import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UpgradePanel from '~/components/app/UpgradePanel.vue';

const features = [
  { title: 'Visual Chatflow Builder', description: 'Drag-and-drop canvas' },
  { title: 'Embeddable Assistant', description: 'Ship the chat widget' },
];

const baseProps = {
  features,
  featureName: 'GenAI',
  contactEmail: 'admin@hiro-microdatacenters.com',
  learnMoreUrl: 'https://hiro-microdatacenters.nl',
};

const global = { stubs: { Icon: true, EnterpriseContactDialog: true } };

describe('UpgradePanel component', () => {
  it('renders the title and every feature', () => {
    const wrapper = mount(UpgradePanel, {
      props: { ...baseProps, title: 'Advanced GenAI Features' },
      global,
    });

    expect(wrapper.text()).toContain('Advanced GenAI Features');
    expect(wrapper.findAll('li')).toHaveLength(2);
    expect(wrapper.text()).toContain('Visual Chatflow Builder');
    expect(wrapper.text()).toContain('Ship the chat widget');
  });

  it('omits the optional banner, subtitle and note when not provided', () => {
    const wrapper = mount(UpgradePanel, {
      props: { ...baseProps, title: 'Gated' },
      global,
    });

    expect(wrapper.text()).not.toContain('Enterprise plan');
    expect(wrapper.find('p').exists()).toBe(false);
  });

  it('renders the banner, badge and note when provided', () => {
    const wrapper = mount(UpgradePanel, {
      props: {
        ...baseProps,
        title: 'Gated',
        subtitle: 'Build assistants',
        banner: 'GenAI is available on the Enterprise plan',
        bannerBadge: 'Enterprise',
      },
      global,
    });

    expect(wrapper.text()).toContain('Build assistants');
    expect(wrapper.text()).toContain(
      'GenAI is available on the Enterprise plan',
    );
    expect(wrapper.text()).toContain('Enterprise');
  });

  it('renders both default actions, with Learn More linking out', () => {
    const wrapper = mount(UpgradePanel, {
      props: { ...baseProps, title: 'Gated' },
      global,
    });

    expect(wrapper.text()).toContain('Try Enterprise Features');

    const learnMore = wrapper.get('a[href="https://hiro-microdatacenters.nl"]');
    expect(learnMore.text()).toContain('Learn More');
    expect(learnMore.attributes('target')).toBe('_blank');
    expect(learnMore.attributes('rel')).toContain('noopener');
  });

  it('opens the contact dialog when Try Enterprise Features is clicked', async () => {
    const wrapper = mount(UpgradePanel, {
      props: { ...baseProps, title: 'Gated' },
      global,
    });

    const dialog = wrapper.getComponent({ name: 'EnterpriseContactDialog' });
    expect(dialog.props('open')).toBe(false);

    const trigger = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Try Enterprise Features'));
    await trigger?.trigger('click');

    expect(dialog.props('open')).toBe(true);
  });

  it('lets the actions slot override the default buttons', () => {
    const wrapper = mount(UpgradePanel, {
      props: { ...baseProps, title: 'Gated' },
      slots: { actions: '<button data-test="cta">Upgrade</button>' },
      global,
    });

    expect(wrapper.find('[data-test="cta"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Try Enterprise Features');
  });
});
