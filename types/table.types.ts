import type { TableRowType } from './row.types';

export interface DataItem {
  id: string;
  name: string;
  description: string;
  status: string;
  type: string;
  last_update: string;
  [key: string]: unknown; // Allow additional properties
}

export interface SearchFilter {
  id: string;
  value: unknown;
  column?: string;
}

export interface SearchFilterParams {
  id: string;
  value: string;
  column: string;
}

export interface TableColumn {
  id: string;
  cell?: (props: { row: TableRowType }) => unknown;
  enableHiding?: boolean;
  [key: string]: unknown; // Allow additional properties
}

export interface TableDataResponse {
  data?: DataItem[] | unknown[] | null;
  message?: string;
  status_code?: number;
  pagination?: {
    total_items: number;
    page: number;
    limit: number;
  };
}

// Generic API response type that matches the actual API responses
export interface ApiTableResponse {
  data?: unknown[] | unknown | null;
  message?: string;
  status_code?: number;
  pagination?: {
    total_items: number;
    page: number;
    limit: number;
  };
}

// Function type for data source
export type TableDataSource = (
  params?: unknown,
) => Promise<TableDataResponse | ApiTableResponse | null | undefined>;
