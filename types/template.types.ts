/**
 * Training Builder example pipelines (`/training-builder-templates`).
 *
 * An example is a ready-made pipeline over the platform's prebuilt
 * components plus a sample dataset; `utils/pipelineTemplate.ts` turns a
 * resolved example into canvas state.
 */

import type {
  Component,
  ComponentInput,
  PipelineInputParam,
} from '~/types/canvas.types';

export interface SampleDatasetInfo {
  key: string;
  dataset_name: string;
  file_name: string;
  kind: 'tabular' | 'image' | string;
  description: string;
  source: string;
  /** The caller's registered copy; null until registered. */
  dataset_id: string | null;
}

export interface PipelineTemplateSummary {
  key: string;
  title: string;
  summary: string;
  tags: string[];
  level: 'starter' | 'intermediate' | string;
  estimated_minutes: number;
  steps: string[];
  serves_model: boolean;
  sample_dataset: SampleDatasetInfo;
  /** False until every platform component the example uses is registered. */
  available: boolean;
}

export interface PipelineTemplateNode {
  label: string;
  position: { x: number; y: number };
  component: Component;
  inputs: ComponentInput[];
}

export interface PipelineTemplateDetail extends PipelineTemplateSummary {
  description: string;
  nodes: PipelineTemplateNode[];
  input_path: PipelineInputParam[];
}
