import type { Position, MarkerType, Edge } from '@vue-flow/core';

export type { Edge };

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
  type?: string;
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

export interface PipelineTemplate {
  name: string;
  container?: Record<string, unknown>;
  inputs?: {
    artifacts?: Array<{ name: string }>;
    parameters?: Array<{ name: string; type?: string }>;
  };
  outputs?: {
    artifacts?: Array<{ name: string }>;
    parameters?: Array<{ name: string; type?: string }>;
  };
  dag?: {
    tasks: Array<{
      name: string;
      template: string;
      dependencies?: string[];
      arguments?: {
        parameters?: Array<{ name: string; value: string }>;
        artifacts?: Array<{ name: string; from: string }>;
      };
    }>;
  };
  metadata?: {
    annotations?: {
      'pipelines.kubeflow.org/component_spec'?: string;
      [key: string]: string | undefined;
    };
  };
}

export interface TaskDetail {
  display_name: string;
  state: string;
}

export interface PipelineData {
  display_name: string;
  pipeline_spec?: {
    spec: {
      templates: PipelineTemplate[];
    };
  };
  pipeline_version_reference?: {
    pipeline_id: string;
    pipeline_version_id: string;
  };
  run_details?: {
    task_details: TaskDetail[];
  };
}

// Type for page.data.builder
export interface PipelineBuilderData {
  name?: string;
  nodes: Node[];
  edges: Edge[];
  input_path?: PipelineInputParam[];
  output_path?: PipelineOutput[];
  pipelineData?: unknown; // Full pipeline run data for readonly mode
}

// Type for partial node updates - allows flexible deep partial updates
export type NodeUpdate = {
  position?: { x: number; y: number };
  data?: Partial<{
    label?: string;
    icon?: string;
    status?: string;
    category?: string;
    component?: Partial<Component> | Record<string, unknown>;
    [key: string]: unknown;
  }>;
};

// Type guard for checking if component has required fields
export function isValidComponent(component: unknown): component is Component {
  return (
    typeof component === 'object' &&
    component !== null &&
    'name' in component &&
    typeof (component as Component).name === 'string' &&
    (component as Component).name !== null
  );
}

// Type guard for checking if node has valid component data
export function hasValidComponentData(node: Node): boolean {
  return (
    node.data?.component !== undefined && isValidComponent(node.data.component)
  );
}
