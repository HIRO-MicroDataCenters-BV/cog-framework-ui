/**
 * The quota card hides itself without a quota, draws one bar per capped
 * resource with the right width and colour, and flags an unsynced or
 * exhausted quota.
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import QuotaUsageCard from '~/components/app/QuotaUsageCard.vue';
import type { QuotaStatus } from '~/types/api.types';

const GIB = 1024 ** 3;

const status = (overrides: Partial<QuotaStatus> = {}): QuotaStatus => ({
  user_id: 'alice@example.com',
  namespace: 'alice',
  enabled: true,
  synced: true,
  resources: [
    {
      resource: 'cpu',
      hard: '4',
      used: '1260m',
      hard_value: 4,
      used_value: 1.26,
      ratio: 0.315,
    },
    {
      resource: 'memory',
      hard: '8Gi',
      used: '7Gi',
      hard_value: 8 * GIB,
      used_value: 7 * GIB,
      ratio: 0.875,
    },
    {
      resource: 'gpu',
      hard: null,
      used: null,
      hard_value: null,
      used_value: null,
      ratio: null,
    },
  ],
  limit_range: null,
  quota_name: 'kf-resource-quota',
  ...overrides,
});

const mountCard = (value: QuotaStatus | null) =>
  mount(QuotaUsageCard, {
    props: { status: value },
    global: { stubs: { Icon: true } },
  });

describe('QuotaUsageCard', () => {
  it('renders nothing without a quota', () => {
    expect(
      mountCard(null).find('[data-testid="quota-usage-card"]').exists(),
    ).toBe(false);
    expect(
      mountCard(status({ enabled: false }))
        .find('[data-testid="quota-usage-card"]')
        .exists(),
    ).toBe(false);
  });

  it('draws one bar per capped resource', () => {
    const wrapper = mountCard(status());
    const bars = wrapper.findAll('[data-resource]');
    expect(bars.map((b) => b.attributes('data-resource'))).toEqual([
      'cpu',
      'memory',
    ]);
    const [cpu, memory] = wrapper.findAll('[data-testid="quota-fill"]');
    expect(cpu.attributes('style')).toContain('width: 32%');
    expect(cpu.classes()).toContain('bg-primary/80');
    expect(memory.attributes('style')).toContain('width: 88%');
    expect(memory.classes()).toContain('bg-amber-500');
    expect(wrapper.text()).toContain('1.26 / 4');
    expect(wrapper.text()).toContain('7 GiB / 8 GiB');
    expect(wrapper.text()).toContain('alice');
    expect(wrapper.find('[data-testid="quota-not-synced"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="quota-over"]').exists()).toBe(false);
  });

  it('flags an unsynced quota and an exhausted resource', () => {
    const exhausted = status({ synced: false });
    exhausted.resources[0] = {
      ...exhausted.resources[0],
      used: '4100m',
      used_value: 4.1,
      ratio: 1.025,
    };
    const wrapper = mountCard(exhausted);
    expect(wrapper.find('[data-testid="quota-not-synced"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="quota-over"]').text()).toBe(
      'hint.quota_pod_rejection',
    );
    const [cpu] = wrapper.findAll('[data-testid="quota-fill"]');
    expect(cpu.attributes('style')).toContain('width: 100%');
    expect(cpu.classes()).toContain('bg-red-500');
    // The bar is clamped for drawing; the text keeps the real percentage.
    const [cpuText] = wrapper.findAll('[data-testid="quota-text"]');
    expect(cpuText.attributes('title')).toBe('4.1 of 4 (103%)');
    expect(
      wrapper.find('[role="progressbar"]').attributes('aria-valuetext'),
    ).toBe('4.1 of 4 (103%)');
  });
});
