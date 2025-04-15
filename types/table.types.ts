export interface DataItem {
  id: string;
  name: string;
  description: string;
  status: string;
  type: string;
  last_update: string;
}

export interface SearchFilter {
  id: string;
  value: unknown;
  column?: string;
}

export interface TableColumn {
  id: string;
  cell?: (props: unknown) => unknown;
}

export interface TableDataResponse {
  data: DataItem[];
  pagination?: {
    total_items: number;
    page: number;
    limit: number;
  };
}
