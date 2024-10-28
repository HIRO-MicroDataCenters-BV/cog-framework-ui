export type Pagination = {
  limit: number;
  page: number;
  total_items: number;
};

export interface ButtonItem {
  variant: 'primary' | 'secondary' | 'tertiary' | 'error';
  type: string;
  ui: 'basic' | 'flat' | 'raised' | 'stroked';
  action?: () => unknown;
  hasClose?: boolean;
}
