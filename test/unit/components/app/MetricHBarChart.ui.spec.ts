import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricHBarChart from '~/components/app/MetricHBarChart.vue';

const mountMetricHBarChart = (props: Record<string, unknown>) =>
  mount(MetricHBarChart, {
    props,
    global: {
      stubs: {
        Icon: true,
        Card: { template: '<div><slot /></div>' },
        CardHeader: { template: '<div><slot /></div>' },
        CardTitle: { template: '<div><slot /></div>' },
        CardContent: { template: '<div><slot /></div>' },
      },
    },
  });

describe('MetricHBarChart component', () => {
  it('shows empty state when no valid metrics are provided', () => {
    const wrapper = mountMetricHBarChart({
      metrics: [{ key: 'accuracy', value: 'not-a-number' }],
    });

    expect(wrapper.text()).toContain('No metrics available');
  });

  it('renders formatted labels and values for valid metrics', () => {
    const wrapper = mountMetricHBarChart({
      metrics: [
        { key: 'accuracy_score', value: 0.9234 },
        { key: 'records_total', value: 120 },
      ],
      runName: 'run-main',
      subtitle: 'Evaluation',
    });

    expect(wrapper.text()).toContain('Accuracy Score');
    expect(wrapper.text()).toContain('Records Total');
    expect(wrapper.text()).toContain('0.92');
    expect(wrapper.text()).toContain('120');
    expect(wrapper.text()).toContain('run-main');
    expect(wrapper.text()).toContain('Evaluation');
  });

  it('shows empty state when max metric value is non-positive', () => {
    const wrapper = mountMetricHBarChart({
      metrics: [{ key: 'loss', value: 0 }],
    });

    expect(wrapper.text()).toContain('No metrics available');
  });
});
