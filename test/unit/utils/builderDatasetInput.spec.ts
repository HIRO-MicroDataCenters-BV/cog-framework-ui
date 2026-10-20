import { describe, it, expect } from 'vitest';
import {
  datasetLabel,
  datasetOptions,
  isDatasetIdInput,
} from '~/utils/builderDatasetInput';

describe('builderDatasetInput.isDatasetIdInput', () => {
  it('matches String inputs named like dataset_id', () => {
    expect(isDatasetIdInput('dataset_id', 'String')).toBe(true);
    expect(isDatasetIdInput('eval_dataset_id', 'string')).toBe(true);
    expect(isDatasetIdInput('DATASET_ID', 'String')).toBe(true);
  });

  it('ignores other names and non-string types', () => {
    expect(isDatasetIdInput('dataset', 'Dataset')).toBe(false);
    expect(isDatasetIdInput('dataset_ids', 'String')).toBe(false);
    expect(isDatasetIdInput('dataset_id', 'Integer')).toBe(false);
    expect(isDatasetIdInput(null, 'String')).toBe(false);
  });
});

describe('builderDatasetInput.datasetOptions', () => {
  const datasets = [
    { id: 'aaa', dataset_name: 'iris' },
    { id: 'bbb', name: 'cifar10-mini' },
    { id: 'ccc' },
  ];

  it('labels by dataset_name, then name, then a short id', () => {
    expect(datasetLabel(datasets[0])).toBe('iris');
    expect(datasetLabel(datasets[1])).toBe('cifar10-mini');
    expect(datasetLabel({ id: 'ccc12345678' })).toBe('ccc12345');
  });

  it('keeps an unknown current value as its own option', () => {
    const options = datasetOptions(datasets, 'zzz');
    expect(options[0]).toEqual({ value: 'zzz', label: 'zzz' });
    expect(options.map((o) => o.value)).toEqual(['zzz', 'aaa', 'bbb', 'ccc']);
    expect(datasetOptions(datasets, 'bbb').map((o) => o.value)).toEqual([
      'aaa',
      'bbb',
      'ccc',
    ]);
    expect(datasetOptions(datasets, '')).toHaveLength(3);
  });
});
