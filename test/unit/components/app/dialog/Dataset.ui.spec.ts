import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import Dataset from '~/components/app/dialog/Dataset.vue';

// `useApi` is imported explicitly in Dataset.vue, so mock the module path.
vi.mock('@/composables/api', () => ({
  useApi: () => ({
    getBrokerDetails: vi.fn().mockResolvedValue({ data: [] }),
    getTopicDetails: vi.fn().mockResolvedValue({ data: [] }),
  }),
}));

const submitDatasetForm = vi.fn().mockResolvedValue({ status_code: 201 });

beforeAll(() => {
  // Auto-imported composables Dataset.vue calls without explicit imports.
  vi.stubGlobal('useToaster', () => ({ show: vi.fn() }));
  vi.stubGlobal('useRuntimeConfig', () => ({ app: { baseURL: '/' } }));
  vi.stubGlobal('useDatasetForm', () => ({ submitDatasetForm }));

  // Override the setup.ts useI18n stub: FormMessage also needs `te`.
  vi.stubGlobal('useI18n', () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params?.minimum != null ? `${key}:${String(params.minimum)}` : key,
    te: (key: string) => /\./.test(key),
  }));
});

beforeEach(() => {
  submitDatasetForm.mockClear();
});

const stubs = {
  Dialog: {
    props: ['open'],
    template:
      '<div data-testid="dialog" :data-open="open ? \'1\' : \'0\'"><slot v-if="open" /></div>',
  },
  DialogContent: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogDescription: { template: '<p><slot /></p>' },
  Separator: { template: '<hr />' },
  Icon: { template: '<i />' },
  Badge: { template: '<span><slot /></span>' },
  Button: {
    inheritAttrs: true,
    template: '<button type="button" v-bind="$attrs"><slot /></button>',
  },
  Input: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', ($event.target).value)" />',
  },
  Textarea: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<textarea v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', ($event.target).value)" />',
  },
  Select: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="select-stub"><slot /></div>',
  },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<span><slot /></span>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: { props: ['value'], template: '<div><slot /></div>' },
  RadioGroup: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div><slot /></div>',
  },
  RadioGroupItem: { props: ['value'], template: '<input type="radio" />' },
};

const mountDialog = () =>
  mount(Dataset, {
    props: { open: true },
    global: { stubs, mocks: { $t: (k: string) => k } },
  });

type W = VueWrapper<unknown>;

const findButtonByText = (wrapper: W, predicate: (text: string) => boolean) =>
  wrapper.findAll('button').find((b) => predicate(b.text().trim()));

const errorParagraphs = (wrapper: W) =>
  wrapper.findAll('p').filter((p) => p.classes().includes('text-destructive'));

// vee-validate's validateField is async and Vue re-renders only after its
// internal microtask + macrotask flush — a single flushPromises is not enough.
const settle = async () => {
  await flushPromises();
  await new Promise((r) => setTimeout(r, 50));
  await flushPromises();
};

const clickNext = async (wrapper: W) => {
  await findButtonByText(wrapper, (t) => t.includes('action.next'))!.trigger(
    'click',
  );
  await settle();
};

const clickBack = async (wrapper: W) => {
  await findButtonByText(wrapper, (t) => t.includes('action.back'))!.trigger(
    'click',
  );
  await settle();
};

const advanceToMetadataStep = async (wrapper: W) => {
  // Step 0 — pick the first dataset type card. It contains label.file as text.
  const fileCard = findButtonByText(wrapper, (t) => t.includes('label.file'));
  expect(fileCard, 'File type card should be present').toBeTruthy();
  await fileCard!.trigger('click');
  await settle();

  // Click Next to advance to Metadata step.
  await clickNext(wrapper);
};

describe('Dataset dialog — step navigation error handling', () => {
  it('renders dialog when open=true', () => {
    const wrapper = mountDialog();
    expect(wrapper.find('[data-testid="dialog"]').attributes('data-open')).toBe(
      '1',
    );
  });

  it('shows validation errors on Metadata step when Next is clicked with empty fields', async () => {
    const wrapper = mountDialog();
    await advanceToMetadataStep(wrapper);

    // No errors yet — the user just arrived at this step.
    expect(errorParagraphs(wrapper)).toHaveLength(0);

    // Click Next without filling required fields → validation should fire.
    await clickNext(wrapper);

    expect(errorParagraphs(wrapper).length).toBeGreaterThan(0);
  });

  it('clears stale errors when navigating back via Back button', async () => {
    const wrapper = mountDialog();
    await advanceToMetadataStep(wrapper);

    // Trigger validation errors on Metadata.
    await clickNext(wrapper);
    expect(errorParagraphs(wrapper).length).toBeGreaterThan(0);

    // Go back to Type step.
    await clickBack(wrapper);

    // After Back, FormMessage no longer renders the <p> elements
    // because vee-validate's per-field errors were cleared.
    expect(errorParagraphs(wrapper)).toHaveLength(0);

    // Coming back forward should also be clean — errors only re-appear
    // when the user actively clicks Next again on empty fields.
    await clickNext(wrapper);
    expect(errorParagraphs(wrapper)).toHaveLength(0);
  });

  it('clears stale errors when clicking on an earlier step indicator', async () => {
    const wrapper = mountDialog();
    await advanceToMetadataStep(wrapper);

    // Trigger validation errors on Metadata.
    await clickNext(wrapper);
    expect(errorParagraphs(wrapper).length).toBeGreaterThan(0);

    // Click the first step indicator (Type) to jump back.
    const navButtons = wrapper.find('nav').findAll('button');
    expect(navButtons.length).toBeGreaterThanOrEqual(2);
    await navButtons[0].trigger('click');
    await settle();

    expect(errorParagraphs(wrapper)).toHaveLength(0);
  });

  it('preserves filled values when navigating back-then-forward (only errors clear)', async () => {
    const wrapper = mountDialog();
    await advanceToMetadataStep(wrapper);

    // Fill the name field.
    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBeGreaterThan(0);
    await inputs[0].setValue('My dataset');
    await settle();

    // Trigger validation (description + dataset_type still empty).
    await clickNext(wrapper);
    expect(errorParagraphs(wrapper).length).toBeGreaterThan(0);

    // Go back, then forward.
    await clickBack(wrapper);
    await clickNext(wrapper);

    // Errors should be gone.
    expect(errorParagraphs(wrapper)).toHaveLength(0);

    // The previously typed name should still be there.
    const inputsAfter = wrapper.findAll('input');
    expect((inputsAfter[0].element as HTMLInputElement).value).toBe(
      'My dataset',
    );
  });
});
