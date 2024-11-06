export type Pagination = {
  limit: number;
  page: number;
  total_items: number;
};

export interface ButtonItem {
  varient: 'primary' | 'secondary' | 'tertiary' | 'error';
  type: string;
  ui: 'basic' | 'flat' | 'raised' | 'stroked';
  action?: () => unknown;
  hasClose?: boolean;
}

export type GetParams = {
  limit?: number;
  page?: number;
  id?: string;
  name?: string;
  model_id?: string;
  model_name?: string;
  dataset_id?: string;
  dataset_name?: string;
};

export interface TableResponse {
  data: unknown[];
  message: string;
  pagination: Pagination;
  status_code: number;
}
