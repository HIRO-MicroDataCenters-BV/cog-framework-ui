import { describe, it, expect } from 'vitest';
import {
  templateNodeId,
  templateToBuilderData,
} from '~/utils/pipelineTemplate';
import { builderDataToPayload } from '~/utils/pipeline-payload.builder';
import type { PipelineTemplateDetail } from '~/types/template.types';

const reader = {
  id: 'c-reader',
  name: 'Tabular dataset reader',
  input_path: [
    { name: 'dataset_id', type: 'String' },
    { name: 'target_column', type: 'String' },
  ],
  output_path: [{ name: 'dataset', type: 'Dataset' }],
  component_file: 's3://mlflow/reader.yaml',
  category: 'data',
  creator: 'HIRO',
};
const split = {
  id: 'c-split',
  name: 'Train test split',
  input_path: [
    { name: 'dataset', type: 'Dataset' },
    { name: 'test_fraction', type: 'Float', default: '0.2' },
  ],
  output_path: [
    { name: 'train', type: 'Dataset' },
    { name: 'test', type: 'Dataset' },
  ],
  component_file: 's3://mlflow/split.yaml',
  category: 'data',
  creator: 'HIRO',
};

const template: PipelineTemplateDetail = {
  key: 'wine-train-and-serve',
  title: 'Wine cultivar: train and serve',
  summary: '',
  description: '',
  tags: ['tabular'],
  level: 'starter',
  estimated_minutes: 6,
  steps: ['Read data', 'Split'],
  serves_model: false,
  available: true,
  sample_dataset: {
    key: 'wine',
    dataset_name: 'sample-wine',
    file_name: 'wine.csv',
    kind: 'tabular',
    description: '',
    source: '',
    dataset_id: 'ds-1',
  },
  input_path: [{ name: 'seed', default: '7' }],
  nodes: [
    {
      label: 'Read data',
      position: { x: 0, y: 0 },
      component: reader,
      inputs: [
        {
          destination: 'dataset_id',
          source: 'ds-1',
          value_source_type: 'constant',
        },
        {
          destination: 'target_column',
          source: 'cultivar',
          value_source_type: 'constant',
        },
      ],
    },
    {
      label: 'Split',
      position: { x: 0, y: 150 },
      component: split,
      inputs: [
        {
          destination: 'dataset',
          source: 'Read data.dataset',
          value_source_type: 'component_output',
        },
        {
          destination: 'test_fraction',
          source: '0.25',
          value_source_type: 'constant',
        },
      ],
    },
  ],
};

const colorOf = (type: string) => `color-${type}`;

describe('templateToBuilderData', () => {
  it('builds one node per step, shaped like a dropped component', () => {
    const data = templateToBuilderData(template, colorOf);
    expect(data.name).toBe('Wine cultivar: train and serve');
    expect(data.nodes.map((n) => n.data.label)).toEqual(['Read data', 'Split']);

    const [readNode] = data.nodes;
    expect(readNode.id).toBe('example-wine-train-and-serve-read-data');
    expect(readNode.position).toEqual({ x: 0, y: 0 });
    expect(readNode.data.category).toBe('data');
    expect(readNode.data.component).toMatchObject({
      id: 'c-reader',
      inputs: template.nodes[0].inputs,
    });
    // Deep copies: editing the canvas never mutates the template.
    expect(readNode.data.component).not.toBe(template.nodes[0].component);
  });

  it('draws an edge for every component_output input', () => {
    const { edges } = templateToBuilderData(template, colorOf);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      source: templateNodeId(template.key, 'Read data'),
      target: templateNodeId(template.key, 'Split'),
      sourceHandle: 'dataset',
      targetHandle: 'dataset',
      data: { color: 'color-Dataset' },
    });
  });

  it('round-trips into the pipeline creation payload', () => {
    const data = templateToBuilderData(template, colorOf);
    const payload = builderDataToPayload(data);
    expect(payload).toEqual({
      name: template.title,
      pipeline_components: [
        { id: 'c-reader', name: 'Read data', inputs: template.nodes[0].inputs },
        { id: 'c-split', name: 'Split', inputs: template.nodes[1].inputs },
      ],
      input_path: [{ name: 'seed', default: '7' }],
      output_path: [],
    });
  });
});
