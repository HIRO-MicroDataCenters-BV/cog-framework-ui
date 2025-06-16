export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'number';

export type ActionType = 'close' | 'back' | 'next' | 'submit' | string;

export interface FieldOption {
  value: string | number;
  label: string;
  subtitle?: string;
}

export interface FieldCondition {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'not_contains';
  value: string | number | boolean;
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

export interface FormField {
  key: string;
  type: string;
  label: string;
  placeholder?: string;
  options?: { value: number | string; label: string }[];
  multiple?: boolean;
}

export interface FormStep {
  key: string;
  title: string;
  fields: FormField[];
}

export interface FormNavigation {
  next: string;
  back: string;
  submit: string;
  cancel: string;
}

export interface ActionLabels {
  next: string;
  back: string;
  submit: string;
  cancel: string;
}
