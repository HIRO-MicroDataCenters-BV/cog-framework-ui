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
