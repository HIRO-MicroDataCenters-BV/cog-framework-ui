import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricChart from '~/components/app/MetricChart.vue';

vi.mock('@unovis/vue', () => ({
  VisSingleContainer: {
    name: 'VisSingleContainer',
    template: '<div><slot /></div>',
  },
  VisDonut: { name: 'VisDonut', template: '<div />' },
}));

const mountMetricChart = (props: Record<string, unknown>) =>
  mount(MetricChart, {
    props,
    global: {
      stubs: {
        ChartContainer: {
          props: ['config'],
          template:
            '<div data-test="chart-container" :data-color="config.value.color"><slot /></div>',
        },
      },
    },
  });

describe('MetricChart component', () => {
  it('renders rounded percentage and label', () => {
    const wrapper = mountMetricChart({
      label: 'Accuracy',
      value: 0.556,
    });

    expect(wrapper.text()).toContain('56%');
    expect(wrapper.text()).toContain('Accuracy');
  });

  it('uses custom color in chart config', () => {
    const wrapper = mountMetricChart({
      label: 'Recall',
      value: 0.4,
      color: '#ff0000',
    });

    expect(
      wrapper.find('[data-test="chart-container"]').attributes('data-color'),
    ).toBe('#ff0000');
  });
});
