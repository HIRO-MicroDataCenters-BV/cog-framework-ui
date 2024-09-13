export interface ITabItem {
  label: string;
  link?: string;
  key?: string;
}

export interface IActionItem {
  label: string;
  action: unknown;
  disabled?: boolean;
}
