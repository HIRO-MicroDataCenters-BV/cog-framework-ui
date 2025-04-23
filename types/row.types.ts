export interface TableRowType {
  getValue: <T = unknown>(key: string) => T;

  getIsSelected: () => boolean;

  getIsExpanded: () => boolean;

  getAllCells: () => unknown[];

  getVisibleCells: () => {
    id: string;
    column: {
      columnDef: {
        cell: unknown;
        header?: unknown;
      };
    };
    getContext: () => unknown;
  }[];

  original: Record<string, unknown>;

  id: string;
}
