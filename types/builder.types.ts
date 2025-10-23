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
}

export interface Component {
  id: string | number;
  name: string | null;
  input_path: ComponentPath[];
  output_path: ComponentPath[];
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

export interface PipelineTemplate {
  name: string;
  container?: Record<string, unknown>;
  inputs?: {
    artifacts?: Array<{ name: string }>;
    parameters?: Array<{ name: string }>;
  };
  outputs?: {
    artifacts?: Array<{ name: string }>;
    parameters?: Array<{ name: string }>;
  };
  dag?: {
    tasks: Array<{
      name: string;
      dependencies?: string[];
    }>;
  };
}

export interface TaskDetail {
  display_name: string;
  state: string;
}

export interface PipelineData {
  display_name: string;
  pipeline_spec: {
    spec: {
      templates: PipelineTemplate[];
    };
  };
  run_details?: {
    task_details: TaskDetail[];
  };
}
