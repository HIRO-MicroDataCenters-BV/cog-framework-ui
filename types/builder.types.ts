import type { Position } from '@vue-flow/core';

export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  targetPosition?: Position;
  sourcePosition?: Position;
  data: {
    label: string;
    icon?: string;
    status?: string;
    category?: string;
    component?: Component;
    [key: string]: unknown;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  sourceNode?: Node;
  targetNode?: Node;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    [key: string]: unknown;
  };
  markerEnd?: {
    type?: string;
    width?: number;
    height?: number;
    color?: string;
  };
}

export interface ComponentPath {
  name: string;
  type: string | 'CSV' | 'parquet';
  description?: string;
  default?: string;
  optional?: boolean;
}

export interface ComponentInput {
  destination: string;
  value_source_type: 'component_output' | 'pipeline_inputparam' | 'constant';
  source: string;
}

export interface PipelineInputParam {
  name: string;
  default?: string;
  description?: string;
}

export interface PipelineOutput {
  name: string;
  source: {
    component_name: string;
    output_name: string;
  };
}

export interface Component {
  id: string | number;
  name: string | null;
  input_path: ComponentPath[];
  output_path: ComponentPath[];
  inputs?: ComponentInput[];
  component_file: string | null;
  category: string | null;
  creator: string | null;
}

export interface Category {
  id: string | number;
  name: string;
  isOpen: boolean;
  components: Component[];
}
