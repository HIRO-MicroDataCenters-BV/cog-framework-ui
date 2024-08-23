import {
  ValidationArtifacts,
  ValidationArtifactsData,
} from './ValidationArtifacts';
import { Pipeline, ValidationMetricsData } from './ValidationMetrics';

export interface ModelDetailInfo {
  data: ModelDetailData[];
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}

export interface ModelDetailData {
  datasets: DatasetInfo[];
  model_files: ModelFileInfo[];
  model_id: number;
  model_name: string;
  model_description: string;
  author: string;
  register_date: string;
  validation_artifacts: ValidationArtifactsData[];
  validation_metrics: ValidationMetricsData[];
  pipelines: Pipeline[];
}

export interface ValidationArtifact {
  dataset_id: number;
  id: number;
  validation_artifacts: ValidationArtifacts;
}

export interface DatasetInfo {
  dataset_id: string;
  dataset_name: string;
}

export interface ModelFileInfo {
  file_id: string;
  file_name: string;
}

export interface ModelValidationTableModel {
  id: number;
  dataset_id: number;
  model_id: number;
}
