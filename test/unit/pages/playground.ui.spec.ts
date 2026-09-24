/**
 * Component tests for the Playground page.
 *
 * Stubs the UI primitives and the API composable so the tests focus on
 * behaviour: the ready-only service filter (with all-services fallback),
 * served model names loading on selection, one completion request per
 * served name with the Question/Answer-wrapped prompt, and answer cards
 * rendering text, latency, token usage and inline errors.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PlaygroundPage from '~/pages/playground/index.vue';

const getModelsServing = vi.fn();
const getServedModels = vi.fn();
const postServedCompletion = vi.fn();
const setPage = vi.fn();

vi.mock('@/composables/api', () => ({
  useApi: () => ({
    getModelsServing,
    getServedModels,
    postServedCompletion,
  }),
}));

beforeAll(() => {
  vi.stubGlobal('useApp', () => ({ setPage }));
});

const stubs = {
  Label: { template: '<label><slot /></label>' },
  Input: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  Textarea: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<textarea v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  Checkbox: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input type="checkbox" v-bind="$attrs" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
  },
  Select: {
    name: 'Select',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div data-testid="select"><slot /></div>',
  },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<span><slot /></span>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: {
    props: ['value'],
    template: '<div :data-value="value"><slot /></div>',
  },
  Collapsible: { template: '<div><slot /></div>' },
  CollapsibleTrigger: { template: '<div><slot /></div>' },
  CollapsibleContent: { template: '<div><slot /></div>' },
  Card: {
    inheritAttrs: true,
    template: '<div v-bind="$attrs"><slot /></div>',
  },
  CardHeader: { template: '<div><slot /></div>' },
  CardTitle: { template: '<div><slot /></div>' },
  CardContent: { template: '<div><slot /></div>' },
  Button: {
    inheritAttrs: true,
    template: '<button type="button" v-bind="$attrs"><slot /></button>',
  },
  Spinner: { template: '<span class="spinner" />' },
  Icon: { template: '<i />' },
};

const mountPage = () =>
  mount(PlaygroundPage, {
    global: { stubs, mocks: { $t: (k: string) => k } },
  });

const readyService = (name: string, status = 'ready') => ({
  isvc_name: name,
  served_model_url: `http://${name}.example`,
  status,
});

const completion = (text: string, completionTokens?: number) => ({
  status_code: 200,
  message: 'ok',
  data: {
    choices: [{ text }],
    usage:
      completionTokens === undefined
        ? undefined
        : { completion_tokens: completionTokens },
  },
});

/** Pick a service through the stubbed Select and wait for its names. */
const selectService = async (
  wrapper: ReturnType<typeof mountPage>,
  isvcName: string,
) => {
  wrapper
    .findComponent({ name: 'Select' })
    .vm.$emit('update:modelValue', isvcName);
  await flushPromises();
};

beforeEach(() => {
  getModelsServing.mockReset();
  getServedModels.mockReset();
  postServedCompletion.mockReset();
  setPage.mockReset();
});

describe('pages/playground/index.vue', () => {
  it('sets the page section so the breadcrumb resolves menu.playground', () => {
    getModelsServing.mockResolvedValueOnce({ data: [] });
    mountPage();
    expect(setPage).toHaveBeenCalledWith({ section: 'playground' });
  });

  it('lists only ready inference services when at least one is ready', async () => {
    getModelsServing.mockResolvedValueOnce({
      data: [
        readyService('qwen-ready'),
        readyService('qwen-pending', 'pending'),
        readyService('qwen-failed', 'failed'),
      ],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(getModelsServing).toHaveBeenCalledTimes(1);
    const values = wrapper
      .findAll('[data-value]')
      .map((el) => el.attributes('data-value'));
    expect(values).toEqual(['qwen-ready']);
    expect(wrapper.find('[data-testid="none-ready-hint"]').exists()).toBe(
      false,
    );
  });

  it('falls back to every service with a hint when none is ready', async () => {
    getModelsServing.mockResolvedValueOnce({
      data: [readyService('svc-a', 'pending'), readyService('svc-b', 'failed')],
    });

    const wrapper = mountPage();
    await flushPromises();

    const values = wrapper
      .findAll('[data-value]')
      .map((el) => el.attributes('data-value'));
    expect(values).toEqual(['svc-a', 'svc-b']);
    expect(wrapper.find('[data-testid="none-ready-hint"]').text()).toBe(
      'hint.playground_none_ready',
    );
  });

  it('shows the empty hint (no fallback hint) when the list is empty or null', async () => {
    getModelsServing.mockResolvedValueOnce(null);

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findAll('[data-value]')).toHaveLength(0);
    expect(wrapper.text()).toContain('hint.playground_no_services');
    expect(wrapper.find('[data-testid="none-ready-hint"]').exists()).toBe(
      false,
    );
  });

  it('loads and renders the served model names once a service is selected', async () => {
    getModelsServing.mockResolvedValueOnce({ data: [readyService('svc')] });
    getServedModels.mockResolvedValueOnce({
      data: {
        isvc_name: 'svc',
        served_model_url: 'http://svc.example',
        models: ['Qwen/Qwen2.5-0.5B', 'pulumi-lora'],
      },
    });

    const wrapper = mountPage();
    await flushPromises();
    expect(getServedModels).not.toHaveBeenCalled();

    await selectService(wrapper, 'svc');

    expect(getServedModels).toHaveBeenCalledWith('svc');
    const names = wrapper
      .findAll('[data-testid="served-model"]')
      .map((el) => el.text());
    expect(names).toEqual(['Qwen/Qwen2.5-0.5B', 'pulumi-lora']);
  });

  it('keeps Ask disabled until a service, its names and a request are present', async () => {
    getModelsServing.mockResolvedValueOnce({ data: [readyService('svc')] });
    getServedModels.mockResolvedValueOnce({
      data: { isvc_name: 'svc', served_model_url: '', models: ['base'] },
    });

    const wrapper = mountPage();
    await flushPromises();

    const ask = () => wrapper.find('[data-testid="ask"]');
    expect(ask().attributes('disabled')).toBeDefined();

    await selectService(wrapper, 'svc');
    expect(ask().attributes('disabled')).toBeDefined();

    await wrapper.find('textarea').setValue('Deploy nginx');
    expect(ask().attributes('disabled')).toBeUndefined();
  });

  it('Ask sends one completion per served name with the Q/A-wrapped prompt and renders each answer', async () => {
    getModelsServing.mockResolvedValueOnce({ data: [readyService('svc')] });
    getServedModels.mockResolvedValueOnce({
      data: {
        isvc_name: 'svc',
        served_model_url: '',
        models: ['base', 'lora'],
      },
    });
    postServedCompletion.mockImplementation(
      async (_isvc: string, body: { model: string }) =>
        body.model === 'lora'
          ? completion('const app = new k8s.apps.v1.Deployment(...)', 42)
          : completion(' Sure, you could use kubectl.'),
    );

    const wrapper = mountPage();
    await flushPromises();
    await selectService(wrapper, 'svc');
    await wrapper
      .find('textarea')
      .setValue('Deploy nginx:1.27 on port 80 with 2 replicas.');

    await wrapper.find('[data-testid="ask"]').trigger('click');
    await flushPromises();

    expect(postServedCompletion).toHaveBeenCalledTimes(2);
    const expectedBody = {
      prompt:
        'Question: Deploy nginx:1.27 on port 80 with 2 replicas.\nAnswer:',
      max_tokens: 700,
      temperature: 0,
      stop: ['Question:'],
    };
    expect(postServedCompletion).toHaveBeenCalledWith('svc', {
      model: 'base',
      ...expectedBody,
    });
    expect(postServedCompletion).toHaveBeenCalledWith('svc', {
      model: 'lora',
      ...expectedBody,
    });

    const cards = wrapper.findAll('[data-testid="answer-card"]');
    expect(cards).toHaveLength(2);
    expect(cards[0].find('[data-testid="answer-text"]').text()).toBe(
      'Sure, you could use kubectl.',
    );
    expect(cards[0].find('[data-testid="latency"]').text()).toMatch(
      /label\.latency: \d+ ms/,
    );
    // No usage block on the base answer → no token count rendered.
    expect(cards[0].find('[data-testid="completion-tokens"]').exists()).toBe(
      false,
    );
    expect(cards[1].find('[data-testid="answer-text"]').text()).toContain(
      'k8s.apps.v1.Deployment',
    );
    expect(cards[1].find('[data-testid="completion-tokens"]').text()).toBe(
      'label.completion_tokens: 42',
    );
  });

  it('does not double-wrap a request that already starts with "Question:" and honours the wrap toggle', async () => {
    getModelsServing.mockResolvedValueOnce({ data: [readyService('svc')] });
    getServedModels.mockResolvedValueOnce({
      data: { isvc_name: 'svc', served_model_url: '', models: ['base'] },
    });
    postServedCompletion.mockResolvedValue(completion('ok'));

    const wrapper = mountPage();
    await flushPromises();
    await selectService(wrapper, 'svc');

    await wrapper
      .find('textarea')
      .setValue('Question: already wrapped\nAnswer:');
    await wrapper.find('[data-testid="ask"]').trigger('click');
    await flushPromises();
    expect(postServedCompletion).toHaveBeenLastCalledWith(
      'svc',
      expect.objectContaining({ prompt: 'Question: already wrapped\nAnswer:' }),
    );

    // Toggle wrapping off: the raw text goes through untouched.
    await wrapper.find('[data-testid="wrap-qa"]').setValue(false);
    await wrapper.find('textarea').setValue('raw prompt');
    await wrapper.find('[data-testid="ask"]').trigger('click');
    await flushPromises();
    expect(postServedCompletion).toHaveBeenLastCalledWith(
      'svc',
      expect.objectContaining({ prompt: 'raw prompt' }),
    );
  });

  it('sends the Advanced max_tokens / temperature values when edited', async () => {
    getModelsServing.mockResolvedValueOnce({ data: [readyService('svc')] });
    getServedModels.mockResolvedValueOnce({
      data: { isvc_name: 'svc', served_model_url: '', models: ['base'] },
    });
    postServedCompletion.mockResolvedValue(completion('ok'));

    const wrapper = mountPage();
    await flushPromises();
    await selectService(wrapper, 'svc');
    await wrapper.find('textarea').setValue('hello');
    await wrapper.find('#pg-max-tokens').setValue('120');
    await wrapper.find('#pg-temperature').setValue('0.7');

    await wrapper.find('[data-testid="ask"]').trigger('click');
    await flushPromises();

    expect(postServedCompletion).toHaveBeenCalledWith(
      'svc',
      expect.objectContaining({ max_tokens: 120, temperature: 0.7 }),
    );
  });

  it('renders a null (failed) completion as an inline error in that card only', async () => {
    getModelsServing.mockResolvedValueOnce({ data: [readyService('svc')] });
    getServedModels.mockResolvedValueOnce({
      data: {
        isvc_name: 'svc',
        served_model_url: '',
        models: ['base', 'lora'],
      },
    });
    // request() returns null on HTTP/network failure rather than throwing.
    postServedCompletion.mockImplementation(
      async (_isvc: string, body: { model: string }) =>
        body.model === 'lora' ? null : completion('fine'),
    );

    const wrapper = mountPage();
    await flushPromises();
    await selectService(wrapper, 'svc');
    await wrapper.find('textarea').setValue('hello');
    await wrapper.find('[data-testid="ask"]').trigger('click');
    await flushPromises();

    const cards = wrapper.findAll('[data-testid="answer-card"]');
    expect(cards[0].find('[data-testid="answer-error"]').exists()).toBe(false);
    expect(cards[0].find('[data-testid="answer-text"]').text()).toBe('fine');
    expect(cards[1].find('[data-testid="answer-error"]').text()).toBe(
      'hint.playground_request_failed',
    );
    expect(cards[1].find('[data-testid="answer-text"]').exists()).toBe(false);
  });

  it('example chips fill the request textarea', async () => {
    getModelsServing.mockResolvedValueOnce({ data: [] });

    const wrapper = mountPage();
    await flushPromises();

    const chips = wrapper.findAll('[data-testid="example-chip"]');
    expect(chips).toHaveLength(3);
    await chips[0].trigger('click');
    expect(
      (wrapper.find('textarea').element as HTMLTextAreaElement).value,
    ).toBe(chips[0].attributes('title'));
  });
});
