export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'number'
  | 'action_button';

export type ActionType = 'close' | 'back' | 'next' | 'submit' | string;

export interface FieldOption {
  value: string | number;
  label: string;
  subtitle?: string;
}

export interface FieldCondition {
  field?: string;
  operator?: 'eq' | 'neq' | 'contains' | 'not_contains';
  value?: string | number | boolean;
  group?: 'and' | 'or';
  conditions?: FieldCondition[];
}

export interface Field {
  type: FieldType;
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  options?: FieldOption[];
  accept?: string;
  condition?: FieldCondition;
  required?: boolean;
  actionName?: string;
  buttonLabel?: string;
  hint?: string;
}

export interface FieldRow {
  fields: Field[];
}

export interface Step {
  rows: FieldRow[];
  title?: string;
  description?: string;
}

export interface ReviewItem {
  label: string;
  valuePath: string;
  value?: string | number | boolean;
  type?: string;
}

export interface ReviewItemsByType {
  [key: string]: ReviewItem[];
}

export interface ReviewTableItem {
  label: string;
  value: unknown;
}

export interface StepFormProps {
  title?: string;
  step?: number;
  steps: Step[];
  isSubmit?: boolean;
  validationSchema: unknown;
  initialValues?: Partial<FormValues>;
  actionLabels?: Record<string, string>;
  reviewItems?: ReviewItemsByType;
  showReviewStep?: boolean;
}

export interface FormValues {
  [key: string]: unknown;
}
