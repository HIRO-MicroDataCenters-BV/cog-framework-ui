import {
  ValidationArtifacts,
  ValidationArtifactsData,
} from "./ValidationArtifacts";
import { ValidationMetricsData } from "./ValidationMetrics";

export interface ModelDetailInfo {
  data: ModelDetailData[];
  errors: any;
  message: string;
  success: boolean;
}

export interface ModelDetailData {
  datasets: DatasetInfo[];
  model_files: ModelFileInfo[];
  model_id: string;
  model_name: string;
  model_description: string;
  author: string;
  register_date: string;
  validation_artifacts: ValidationArtifactsData[];
  validation_metrics: ValidationMetricsData[];
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
