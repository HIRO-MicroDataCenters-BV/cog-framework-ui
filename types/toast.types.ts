export type ToastData = Record<string, unknown>;

export interface ToastError {
  message?: string;
  detail?: string;
  [key: string]: unknown;
}
