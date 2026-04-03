import type {
  Node,
  Edge,
  PipelineInputParam,
  PipelineOutput,
} from './canvas.types';

export interface PageBuilderData {
  builder: {
    name: string;
    nodes: Node[];
    edges: Edge[];
    input_path?: PipelineInputParam[];
    output_path?: PipelineOutput[];
  };
  /** Order ID from dataspace for federated pipeline runs */
  orderId?: string;
}

export interface Page {
  section?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  data?: PageBuilderData;
  isLoading?: boolean;
}
