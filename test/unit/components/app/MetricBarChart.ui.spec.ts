import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricBarChart from '~/components/app/MetricBarChart.vue';

const mountMetricBarChart = (props: Record<string, unknown>) =>
  mount(MetricBarChart, {
    props,
    global: {
      stubs: {
        Icon: true,
      },
    },
  });

describe('MetricBarChart component', () => {
  it('renders metric title and optional run legend', () => {
    const wrapper = mountMetricBarChart({
      name: 'Accuracy',
      value: 0.8,
      runName: 'run-123',
    });

    expect(wrapper.text()).toContain('Accuracy');
    expect(wrapper.text()).toContain('run-123');
  });

  it('formats normalized values with two decimals', () => {
    const wrapper = mountMetricBarChart({
      name: 'AUC',
      value: 0.5,
    });

    expect(wrapper.text()).toContain('0.50');
  });

  it('formats non-normalized integer values without decimals', () => {
    const wrapper = mountMetricBarChart({
      name: 'Rows',
      value: 120,
    });

    expect(wrapper.text()).toContain('120');
  });
});
