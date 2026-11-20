/**
 * The quota dialog prefills from the current quota, sends only the capped
 * resources (an uncapped one is simply absent, which the API reads as no
 * cap), refuses an all-uncapped form, and stays open when the request
 * fails.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import QuotaEditDialog from '~/components/app/dialog/QuotaEditDialog.vue';
import type { QuotaStatus } from '~/types/api.types';

const putQuota = vi.fn();
vi.mock('@/composables/api', () => ({ useApi: () => ({ putQuota }) }));

const GIB = 1024 ** 3;
const CURRENT: QuotaStatus = {
  user_id: 'alice@example.com',
  namespace: 'alice',
  enabled: true,
  synced: true,
  resources: [
    {
      resource: 'cpu',
      hard: '2500m',
      used: '1',
      hard_value: 2.5,
      used_value: 1,
      ratio: 0.4,
    },
    {
      resource: 'memory',
      hard: '512Mi',
      used: '100Mi',
      hard_value: 512 * 1024 ** 2,
      used_value: 100 * 1024 ** 2,
      ratio: 0.2,
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
};

/** A v-model-capable stand-in for the Switch primitive. */
const SwitchStub = defineComponent({
  name: 'Switch',
  props: { modelValue: Boolean, id: String },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        type: 'checkbox',
        id: props.id,
        checked: props.modelValue,
        ...attrs,
        onChange: (e: Event) =>
          emit('update:modelValue', (e.target as HTMLInputElement).checked),
      });
  },
});

const passthrough = (name: string) =>
  defineComponent({
    name,
    setup:
      (_p, { slots }) =>
      () =>
        h('div', slots.default?.()),
  });

const mountDialog = (current: QuotaStatus | null = CURRENT) =>
  mount(QuotaEditDialog, {
    props: {
      open: true,
      userId: 'alice@example.com',
      namespace: 'alice',
      current,
    },
    global: {
      stubs: {
        Dialog: passthrough('Dialog'),
        DialogContent: passthrough('DialogContent'),
        DialogHeader: passthrough('DialogHeader'),
        DialogTitle: passthrough('DialogTitle'),
        DialogDescription: passthrough('DialogDescription'),
        DialogFooter: passthrough('DialogFooter'),
        Select: passthrough('Select'),
        SelectTrigger: passthrough('SelectTrigger'),
        SelectValue: true,
        SelectContent: passthrough('SelectContent'),
        SelectItem: true,
        Spinner: true,
        Switch: SwitchStub,
      },
    },
  });

beforeEach(() => {
  putQuota.mockReset();
});

describe('QuotaEditDialog', () => {
  it('prefills from the current quota', () => {
    const wrapper = mountDialog();
    expect(
      (
        wrapper.find('[data-testid="quota-cpu-input"]')
          .element as HTMLInputElement
      ).value,
    ).toBe('2.5');
    expect(
      (
        wrapper.find('[data-testid="quota-memory-input"]')
          .element as HTMLInputElement
      ).value,
    ).toBe('512');
    expect(
      (
        wrapper.find('[data-testid="quota-gpu-switch"]')
          .element as HTMLInputElement
      ).checked,
    ).toBe(false);
    expect(
      (
        wrapper.find('[data-testid="quota-gpu-input"]')
          .element as HTMLInputElement
      ).disabled,
    ).toBe(true);
  });

  it('sends only the capped resources and closes on success', async () => {
    putQuota.mockResolvedValue({ data: { ...CURRENT, synced: false } });
    const wrapper = mountDialog();
    await wrapper.find('[data-testid="quota-cpu-input"]').setValue('4');
    await wrapper.find('[data-testid="quota-gpu-switch"]').setValue(true);
    await wrapper.find('[data-testid="quota-gpu-input"]').setValue('1');
    await wrapper.find('[data-testid="quota-save"]').trigger('click');
    await flushPromises();
    expect(putQuota).toHaveBeenCalledWith('alice@example.com', {
      cpu: '4',
      memory: '512Mi',
      gpu: 1,
    });
    expect(wrapper.emitted('saved')).toHaveLength(1);
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('refuses a form with nothing capped', async () => {
    const wrapper = mountDialog();
    await wrapper.find('[data-testid="quota-cpu-switch"]').setValue(false);
    await wrapper.find('[data-testid="quota-memory-switch"]').setValue(false);
    const save = wrapper.find('[data-testid="quota-save"]');
    expect((save.element as HTMLButtonElement).disabled).toBe(true);
    expect(wrapper.find('[data-testid="quota-blocking-reason"]').text()).toBe(
      'hint.quota_at_least_one',
    );
  });

  it('does not read an emptied GPU field as zero', async () => {
    const wrapper = mountDialog();
    await wrapper.find('[data-testid="quota-gpu-switch"]').setValue(true);
    await wrapper.find('[data-testid="quota-gpu-input"]').setValue('');
    const save = wrapper.find('[data-testid="quota-save"]');
    expect((save.element as HTMLButtonElement).disabled).toBe(true);
    expect(wrapper.find('[data-testid="quota-blocking-reason"]').text()).toBe(
      'hint.quota_gpu_integer',
    );
    // An explicit zero is allowed: it forbids GPUs.
    await wrapper.find('[data-testid="quota-gpu-input"]').setValue('0');
    expect((save.element as HTMLButtonElement).disabled).toBe(false);
  });

  it('keeps an untouched cap at its original quantity', async () => {
    // 1500Mi has no exact GiB form; an untouched field must not be re-sent
    // as a rounded display value.
    const current: QuotaStatus = {
      ...CURRENT,
      resources: [
        {
          resource: 'cpu',
          hard: '4000m',
          used: '1',
          hard_value: 4,
          used_value: 1,
          ratio: 0.25,
        },
        {
          resource: 'memory',
          hard: '1500Mi',
          used: '100Mi',
          hard_value: 1500 * 1024 ** 2,
          used_value: 100 * 1024 ** 2,
          ratio: 0.07,
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
    };
    putQuota.mockResolvedValue({ data: current });
    const wrapper = mountDialog(current);
    expect(
      (
        wrapper.find('[data-testid="quota-memory-input"]')
          .element as HTMLInputElement
      ).value,
    ).toBe('1500');
    await wrapper.find('[data-testid="quota-cpu-input"]').setValue('6');
    await wrapper.find('[data-testid="quota-save"]').trigger('click');
    await flushPromises();
    expect(putQuota).toHaveBeenCalledWith('alice@example.com', {
      cpu: '6',
      memory: '1500Mi',
    });
  });

  it('labels every numeric input for assistive technology', () => {
    const wrapper = mountDialog();
    for (const id of [
      'quota-cpu-input',
      'quota-memory-input',
      'quota-gpu-input',
    ]) {
      expect(
        wrapper.find(`[data-testid="${id}"]`).attributes('aria-label'),
      ).toBeTruthy();
    }
  });

  it('stays open when the request fails', async () => {
    putQuota.mockResolvedValue(null);
    const wrapper = mountDialog();
    await wrapper.find('[data-testid="quota-save"]').trigger('click');
    await flushPromises();
    expect(putQuota).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('saved')).toBeUndefined();
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });
});
