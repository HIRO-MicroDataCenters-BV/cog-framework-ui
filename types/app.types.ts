import type { Node, Edge } from './builder.types';

export interface PageBuilderData {
  builder: {
    name: string;
    nodes: Node[];
    edges: Edge[];
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
