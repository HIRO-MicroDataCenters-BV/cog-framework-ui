import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricsBarChart from '~/components/app/MetricsBarChart.vue';

vi.mock('@unovis/vue', () => ({
  VisXYContainer: { name: 'VisXYContainer', template: '<div><slot /></div>' },
  VisGroupedBar: { name: 'VisGroupedBar', template: '<div />' },
  VisAxis: { name: 'VisAxis', template: '<div />' },
}));

const mountMetricsBarChart = (props: Record<string, unknown>) =>
  mount(MetricsBarChart, {
    props,
    global: {
      stubs: {
        Icon: true,
        Card: { template: '<div><slot /></div>' },
        CardHeader: { template: '<div><slot /></div>' },
        CardTitle: { template: '<div><slot /></div>' },
        CardContent: { template: '<div><slot /></div>' },
        ChartContainer: { template: '<div><slot /></div>' },
      },
    },
  });

describe('MetricsBarChart component', () => {
  it('renders overview when metrics include normalized values', () => {
    const wrapper = mountMetricsBarChart({
      metrics: [
        { key: 'accuracy_score', value: 0.92 },
        { key: 'f1_score', value: 0.87 },
      ],
    });

    expect(wrapper.text()).toContain('Metrics Overview');
  });

  it('does not render chart card when no values are in 0..1 range', () => {
    const wrapper = mountMetricsBarChart({
      metrics: [
        { key: 'rows', value: 120 },
        { key: 'bad', value: -1 },
      ],
    });

    expect(wrapper.text()).not.toContain('Metrics Overview');
    expect(wrapper.html()).toBe('<!--v-if-->');
  });
});
