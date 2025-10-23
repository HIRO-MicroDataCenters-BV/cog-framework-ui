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
  source_settings?: Record<string, unknown>;
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

/**
 * Model recommendation parameters
 */
export interface ModelRecommendParams {
  /** The name of the model to filter the recommendation (e.g., "LR" for Logistic Regression) */
  model_name?: string;
  /** List of classification metrics to rank models by (e.g., accuracy_score, f1_score, recall_score, precision_score) */
  classification_score?: string[];
}

/**
 * Model query parameters
 */
export interface ModelQueryParams {
  /** Model ID */
  id?: number;
  /** Duration filter in days to fetch models */
  last_days?: number;
  /** The name of the model to retrieve */
  name?: string;
  /** Sort order for last_modified_time: 'asc' or 'desc' */
  sort_order?: 'asc' | 'desc';
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  limit?: number;
}

/**
 * Dataset query parameters
 */
export interface DatasetQueryParams {
  /** The name of the dataset to search for */
  name?: string;
  /** Dataset ID */
  id?: number;
  /** Duration of the dataset in days */
  last_days?: number;
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  limit?: number;
}

/**
 * Model file upload parameters
 */
export interface ModelFileUploadParams {
  /** Model ID */
  id: number;
  /** Files to upload */
  files: File[];
  /** File type: 0 - Model Policy File, 1 - Model File */
  file_type: string;
  /** Optional file description */
  file_description?: string;
}

/**
 * Dataset file upload parameters
 */
export interface DatasetFileUploadParams {
  /** Dataset ID */
  id: number;
  /** Files to upload */
  files: File[];
  /** Dataset name */
  name: string;
  /** Dataset type: 0 (train data), 1 (inference data), or 2 (both) */
  dataset_type: number;
  /** Optional description */
  description?: string;
}

/**
 * Pipeline component query parameters
 */
export interface PipelineComponentParams {
  /** Pipeline ID */
  pipeline_id?: string;
  /** Pipeline name */
  pipeline_name?: string;
  /** Pipeline workflow name */
  pipeline_workflow_name?: string;
}

/**
 * Pod management parameters
 */
export interface PodParams {
  /** Pod name */
  pod_name: string;
  /** Namespace (optional) */
  namespace?: string;
  /** Container name (optional) */
  container_name?: string;
}

/**
 * Inference service parameters
 */
export interface InferenceServiceParams {
  /** Inference service name */
  inference_service_name: string;
  /** Namespace (optional) */
  namespace?: string;
  /** Container name (optional) */
  container_name?: string;
}
