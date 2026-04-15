/**
 * Canvas / graph layer types.
 *
 * These describe the Vue Flow canvas state: nodes, edges, per-component
 * catalog data, and the in-memory builder state (`PipelineBuilderData`).
 *
 * Nothing here is sent directly to the backend. The conversion from these
 * types to the API payload lives in `Header.vue → executePipelineRun()`.
 */

import type { Position, Edge } from '@vue-flow/core';

export type { Edge };

// ---------------------------------------------------------------------------
// Canvas nodes
// ---------------------------------------------------------------------------

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

/** Partial update shape used when mutating a node without replacing it fully */
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

// ---------------------------------------------------------------------------
// Component catalog (fetched from API, stored on Node.data.component)
// ---------------------------------------------------------------------------

/** One input/output artifact slot defined by the component catalog */
export interface ComponentPath {
  name: string;
  type: string | 'CSV' | 'parquet';
  description?: string;
  default?: string;
  optional?: boolean;
}

/**
 * A user-configured wiring between components (or to a pipeline param).
 * Stored in `Component.inputs[]` on each canvas node.
 */
export interface ComponentInput {
  destination: string;
  value_source_type: 'component_output' | 'pipeline_inputparam' | 'constant';
  source: string;
}

/** Full catalog entry attached to a canvas node via `node.data.component` */
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

/** Group of components shown in the library sidebar */
export interface Category {
  id: string | number;
  name: string;
  isOpen: boolean;
  components: Component[];
}

// ---------------------------------------------------------------------------
// Pipeline-level builder state
// ---------------------------------------------------------------------------

/** A pipeline-level input parameter (shown in Manage Parameters panel) */
export interface PipelineInputParam {
  name: string;
  type?: string;
  default?: string;
  description?: string;
}

/** A pipeline-level output wired to a specific component output */
export interface PipelineOutput {
  name: string;
  source: {
    component_name: string;
    output_name: string;
  };
}

/**
 * Root builder state stored in `page.data.builder`.
 * Drives the canvas, parameters panel, and outputs panel.
 */
export interface PipelineBuilderData {
  name?: string;
  nodes: Node[];
  edges: Edge[];
  input_path?: PipelineInputParam[];
  output_path?: PipelineOutput[];
  pipelineData?: unknown; // Full pipeline run data for readonly mode
}

// ---------------------------------------------------------------------------
// Kubeflow pipeline run / readonly viewer types
// Describes pipeline specs returned by the Kubeflow API (not creation payloads).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isValidComponent(component: unknown): component is Component {
  return (
    typeof component === 'object' &&
    component !== null &&
    'name' in component &&
    typeof (component as Component).name === 'string' &&
    (component as Component).name !== null
  );
}

export function hasValidComponentData(node: Node): boolean {
  return (
    node.data?.component !== undefined && isValidComponent(node.data.component)
  );
}
