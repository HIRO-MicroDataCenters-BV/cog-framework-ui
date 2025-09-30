export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    icon?: string;
    status?: string;
    category?: string;
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
