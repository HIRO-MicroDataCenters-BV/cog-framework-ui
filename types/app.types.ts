import type { Node, Edge } from './builder.types';

export interface Page {
  section?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  data?: { builder: { name: string; nodes: Node[]; edges: Edge[] } };
}
