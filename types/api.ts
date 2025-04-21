import type { FormValues } from './form';

export interface FileDatasetValues extends FormValues {
  metadata?: {
    name?: string;
    description?: string;
  };
  source_settings?: {
    dataset_file?: File;
  };
}

export interface TableDatasetValues extends FormValues {
  metadata?: {
    name?: string;
    description?: string;
  };
  source_settings?: {
    db_url?: string;
    table_name?: string;
    selected_fields?: string;
  };
}

export interface StreamDatasetValues extends FormValues {
  metadata?: {
    name?: string;
    description?: string;
  };
  source_settings?: {
    broker_name?: string;
    broker_ip_address?: string;
    broker_port?: number;
    topic_name?: string;
    topic_schema?: string;
  };
}

export interface DatasetFormValues extends FormValues {
  type?: 'file' | 'table' | 'data_stream';
  metadata?: {
    name?: string;
    description?: string;
  };
  source_settings?: Record<string, any>;
}

export interface FileDatasetRegisterParams {
  files: File[];
  name: string;
  dataset_type: number;
  description: string;
}

export interface TableDatasetRegisterParams {
  dataset_type: number;
  name: string;
  description: string;
  db_url: string;
  table_name: string;
  selected_fields: string;
}

export interface StreamDatasetRegisterParams {
  dataset_type: number;
  dataset_name: string;
  description: string;
  broker_name: string;
  broker_ip_address: string;
  broker_port: number;
  topic_name: string;
  topic_schema: string;
}
