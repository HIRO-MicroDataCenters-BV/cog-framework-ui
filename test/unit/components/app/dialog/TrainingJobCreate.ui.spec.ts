/**
 * Component tests for the TrainingJobCreate dialog.
 *
 * The heavy UI primitives are stubbed so the tests cover the dialog's own
 * behaviour: the catalog drives the hyperparameter fields and the dataset
 * filter, the submitted payload carries typed knobs, and the launch button
 * stays disabled (with a reason) until the form is complete and in range.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TrainingJobCreate from '~/components/app/dialog/TrainingJobCreate.vue';

const getTrainingAlgorithms = vi.fn();
const getDatasets = vi.fn();
const getDatasetFileDetails = vi.fn();
const createTrainingJob = vi.fn();

vi.mock('@/composables/api', () => ({
  useApi: () => ({
    getTrainingAlgorithms,
    getDatasets,
    getDatasetFileDetails,
    createTrainingJob,
  }),
}));

beforeAll(() => {
  vi.stubGlobal('useToaster', () => ({ show: vi.fn() }));
});

const ALGORITHMS = [
  {
    id: 'pytorch-tabular-classifier',
    name: 'Tabular classifier (PyTorch MLP)',
    framework: 'pytorch',
    task: 'classification',
    description: 'MLP with softmax head.',
    dataset_requirements: {
      dataset_types: [0, 2],
      data_source_types: [0],
      file_extensions: ['.csv', '.parquet'],
      target_column_required: true,
      description: 'One CSV with a header row.',
    },
    hyperparams: [
      { name: 'epochs', type: 'int', default: 20, min: 1, max: 1000 },
      {
        name: 'learning_rate',
        type: 'float',
        default: 0.001,
        min: 0.000001,
        max: 1,
      },
      { name: 'hidden_sizes', type: 'str', default: '128,64' },
    ],
    image: 'hiroregistry/cogflow:latest-beta-torch',
    supports_distributed: true,
    supports_gpu: true,
  },
  {
    id: 'tensorflow-tabular-regressor',
    name: 'Tabular regressor (TensorFlow)',
    framework: 'tensorflow',
    task: 'regression',
    description: 'Keras MLP with linear head.',
    dataset_requirements: {
      dataset_types: [0, 2],
      data_source_types: [0],
      file_extensions: ['.csv', '.parquet'],
      target_column_required: true,
    },
    hyperparams: [
      { name: 'epochs', type: 'int', default: 10, min: 1, max: 100 },
    ],
    image: 'hiroregistry/cogflow:latest-beta-tensor',
    supports_distributed: false,
    supports_gpu: false,
  },
];

const DATASETS = [
  {
    id: 'ds-train',
    dataset_name: 'iris-train',
    train_and_inference_type: 0,
    data_source_type: 0,
  },
  {
    id: 'ds-both',
    dataset_name: 'iris-both',
    train_and_inference_type: 2,
    data_source_type: 0,
  },
  // JSONL (5) → not a tabular dataset
  {
    id: 'ds-jsonl',
    dataset_name: 'prompts',
    train_and_inference_type: 5,
    data_source_type: 0,
  },
  // table source (1) → not an uploaded file
  {
    id: 'ds-table',
    dataset_name: 'pg-table',
    train_and_inference_type: 0,
    data_source_type: 1,
  },
];

const stubs = {
  Dialog: {
    name: 'Dialog',
    props: ['open'],
    template:
      '<div data-testid="dialog" :data-open="open ? \'1\' : \'0\'"><slot v-if="open" /></div>',
  },
  DialogContent: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogFooter: { template: '<div class="footer"><slot /></div>' },
  Label: { template: '<label><slot /></label>' },
  Input: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  Select: {
    name: 'Select',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<div data-testid="select"><slot /><button class="pick" @click="$emit(\'update:modelValue\', $attrs[\'data-test-value\'])">pick</button></div>',
  },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<span><slot /></span>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: {
    props: ['value'],
    template: '<div :data-value="value"><slot /></div>',
  },
  Button: { template: '<button v-bind="$attrs"><slot /></button>' },
  Spinner: { template: '<span class="spinner" />' },
  Icon: { template: '<i />' },
};

const mountDialog = (open = true) =>
  mount(TrainingJobCreate, { props: { open }, global: { stubs } });

/** Drive a stubbed Select by emitting update:modelValue from its component. */
const pickSelect = async (
  wrapper: ReturnType<typeof mountDialog>,
  index: number,
  value: string,
) => {
  const selects = wrapper.findAllComponents({ name: 'Select' });
  selects[index].vm.$emit('update:modelValue', value);
  await flushPromises();
};

const setInput = async (
  wrapper: ReturnType<typeof mountDialog>,
  id: string,
  value: string,
) => {
  await wrapper.find(`#${id}`).setValue(value);
  await flushPromises();
};

beforeEach(() => {
  getTrainingAlgorithms.mockReset();
  getDatasets.mockReset();
  createTrainingJob.mockReset();
  getTrainingAlgorithms.mockResolvedValue({ data: ALGORITHMS });
  getDatasets.mockResolvedValue({ data: DATASETS });
  getDatasetFileDetails.mockReset();
  getDatasetFileDetails.mockImplementation(async (id: string) => ({
    data: { file_name: id === 'ds-both' ? 'prices.PARQUET' : `${id}.csv` },
  }));
});

describe('TrainingJobCreate', () => {
  it('loads the catalog and datasets when opened', async () => {
    const wrapper = mountDialog();
    await flushPromises();
    expect(getTrainingAlgorithms).toHaveBeenCalledTimes(1);
    expect(getDatasets).toHaveBeenCalledWith({ limit: 200 });
    const ids = wrapper
      .findAll('[data-value]')
      .map((el) => el.attributes('data-value'));
    expect(ids).toContain('pytorch-tabular-classifier');
    expect(ids).toContain('tensorflow-tabular-regressor');
    // No algorithm picked yet: no hyperparameter fields.
    expect(wrapper.find('[data-testid="hyperparam-epochs"]').exists()).toBe(
      false,
    );
  });

  it('renders the selected algorithm summary, its knobs and only compatible datasets', async () => {
    const wrapper = mountDialog();
    await flushPromises();
    await pickSelect(wrapper, 0, 'pytorch-tabular-classifier');

    const summary = wrapper.find('[data-testid="algorithm-summary"]').text();
    expect(summary).toContain('pytorch');
    expect(summary).toContain('classification');

    expect(wrapper.find('[data-testid="hyperparam-epochs"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="hyperparam-learning_rate"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="hyperparam-hidden_sizes"]').exists(),
    ).toBe(true);
    expect(
      (wrapper.find('#tj-hp-epochs').element as HTMLInputElement).value,
    ).toBe('20');
    expect(
      (wrapper.find('#tj-hp-hidden_sizes').element as HTMLInputElement).value,
    ).toBe('128,64');

    const ids = wrapper
      .findAll('[data-value]')
      .map((el) => el.attributes('data-value'));
    expect(ids).toContain('ds-train');
    expect(ids).toContain('ds-both');
    expect(ids).not.toContain('ds-jsonl');
    expect(ids).not.toContain('ds-table');
  });

  it('keeps Launch disabled and names the first missing requirement', async () => {
    const wrapper = mountDialog();
    await flushPromises();
    const launch = () => wrapper.find('[data-testid="launch-training-job"]');
    expect(launch().attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('hint.training_job_select_algorithm');

    await pickSelect(wrapper, 0, 'pytorch-tabular-classifier');
    expect(wrapper.text()).toContain('hint.training_job_select_dataset');

    await pickSelect(wrapper, 1, 'ds-train');
    expect(wrapper.text()).toContain('hint.training_job_enter_name');

    await setInput(wrapper, 'tj-output-name', 'iris-mlp');
    expect(wrapper.text()).toContain('hint.training_job_enter_target');

    await setInput(wrapper, 'tj-target-column', 'species');
    expect(launch().attributes('disabled')).toBeUndefined();

    // Out-of-range knob re-disables with the knob's name in the hint.
    await setInput(wrapper, 'tj-hp-epochs', '0');
    expect(launch().attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain(
      'hint.training_job_hyperparam_invalid:epochs',
    );
  });

  it('submits a typed payload and emits created on success', async () => {
    createTrainingJob.mockResolvedValueOnce({
      data: { id: 'job-1', state: 'created', name: 'iris-mlp' },
    });
    const wrapper = mountDialog();
    await flushPromises();
    await pickSelect(wrapper, 0, 'pytorch-tabular-classifier');
    await pickSelect(wrapper, 1, 'ds-both');
    await setInput(wrapper, 'tj-output-name', ' iris-mlp ');
    await setInput(wrapper, 'tj-target-column', 'species');
    await setInput(wrapper, 'tj-hp-epochs', '7');
    await setInput(wrapper, 'tj-hp-learning_rate', '0.01');
    await setInput(wrapper, 'tj-workers', '3');
    await setInput(wrapper, 'tj-gpus', '1');

    await wrapper.find('[data-testid="launch-training-job"]').trigger('click');
    await flushPromises();

    expect(createTrainingJob).toHaveBeenCalledTimes(1);
    expect(createTrainingJob).toHaveBeenCalledWith({
      algorithm_id: 'pytorch-tabular-classifier',
      dataset_id: 'ds-both',
      output_name: 'iris-mlp',
      target_column: 'species',
      hyperparams: { epochs: 7, learning_rate: 0.01, hidden_sizes: '128,64' },
      workers: 3,
      gpus: 1,
    });
    const created = wrapper.emitted('created');
    expect(created).toBeTruthy();
    expect(created![0][0]).toMatchObject({ id: 'job-1' });
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
  });

  it('resets knobs and drops an incompatible dataset when the algorithm changes', async () => {
    const wrapper = mountDialog();
    await flushPromises();
    await pickSelect(wrapper, 0, 'pytorch-tabular-classifier');
    await setInput(wrapper, 'tj-hp-epochs', '99');
    await pickSelect(wrapper, 0, 'tensorflow-tabular-regressor');
    expect(
      (wrapper.find('#tj-hp-epochs').element as HTMLInputElement).value,
    ).toBe('10');
    expect(
      wrapper.find('[data-testid="hyperparam-hidden_sizes"]').exists(),
    ).toBe(false);
  });

  it('does not emit created when the request fails', async () => {
    createTrainingJob.mockResolvedValueOnce(null);
    const wrapper = mountDialog();
    await flushPromises();
    await pickSelect(wrapper, 0, 'pytorch-tabular-classifier');
    await pickSelect(wrapper, 1, 'ds-train');
    await setInput(wrapper, 'tj-output-name', 'x');
    await setInput(wrapper, 'tj-target-column', 'y');
    await wrapper.find('[data-testid="launch-training-job"]').trigger('click');
    await flushPromises();
    expect(wrapper.emitted('created')).toBeFalsy();
    expect(wrapper.find('[data-testid="dialog"]').attributes('data-open')).toBe(
      '1',
    );
  });

  it('checks the uploaded file extension against the algorithm requirements', async () => {
    getDatasetFileDetails.mockImplementation(async () => ({
      data: { file_name: 'sheet.xlsx' },
    }));
    const wrapper = mountDialog();
    await flushPromises();
    await pickSelect(wrapper, 0, 'pytorch-tabular-classifier');
    await pickSelect(wrapper, 1, 'ds-train');
    await setInput(wrapper, 'tj-output-name', 'x');
    await setInput(wrapper, 'tj-target-column', 'y');
    expect(getDatasetFileDetails).toHaveBeenCalledWith('ds-train');
    const launch = wrapper.find('[data-testid="launch-training-job"]');
    expect(launch.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('hint.training_job_dataset_file_type');

    // A matching file re-enables submit.
    getDatasetFileDetails.mockImplementation(async () => ({
      data: { file_name: 'rows.csv' },
    }));
    await pickSelect(wrapper, 1, 'ds-both');
    expect(
      wrapper
        .find('[data-testid="launch-training-job"]')
        .attributes('disabled'),
    ).toBeUndefined();
  });

  it('treats a failed file lookup as not launchable', async () => {
    getDatasetFileDetails.mockResolvedValue(null);
    const wrapper = mountDialog();
    await flushPromises();
    await pickSelect(wrapper, 0, 'pytorch-tabular-classifier');
    await pickSelect(wrapper, 1, 'ds-train');
    await setInput(wrapper, 'tj-output-name', 'x');
    await setInput(wrapper, 'tj-target-column', 'y');
    expect(wrapper.text()).toContain('hint.training_job_dataset_file_unknown');
    expect(
      wrapper
        .find('[data-testid="launch-training-job"]')
        .attributes('disabled'),
    ).toBeDefined();
  });

  it('resets replicas and GPUs when the new algorithm does not support them', async () => {
    createTrainingJob.mockResolvedValueOnce({ data: { id: 'job-2' } });
    const wrapper = mountDialog();
    await flushPromises();
    await pickSelect(wrapper, 0, 'pytorch-tabular-classifier');
    await setInput(wrapper, 'tj-workers', '4');
    await setInput(wrapper, 'tj-gpus', '2');
    await pickSelect(wrapper, 0, 'tensorflow-tabular-regressor');
    expect(
      (wrapper.find('#tj-workers').element as HTMLInputElement).value,
    ).toBe('1');
    expect((wrapper.find('#tj-gpus').element as HTMLInputElement).value).toBe(
      '0',
    );
    await pickSelect(wrapper, 1, 'ds-train');
    await setInput(wrapper, 'tj-output-name', 'x');
    await setInput(wrapper, 'tj-target-column', 'y');
    await wrapper.find('[data-testid="launch-training-job"]').trigger('click');
    await flushPromises();
    expect(createTrainingJob).toHaveBeenCalledWith(
      expect.objectContaining({ workers: 1, gpus: 0 }),
    );
  });
});
