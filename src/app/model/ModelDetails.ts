import { ValidationArtifacts } from './ValidationArtifacts';
import { DatesetType } from './DatasetInfo';

export interface ModelDetailInfo {
  data: ModelDetailData[];
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}

export interface ModelDetailData {
  datasets: ModelDatasetInfo[];
  model_files: ModelFileInfo[];
  model_id: number;
  model_name: string;
  model_description: string;
  author: number;
  register_date: string;
}

export interface ValidationArtifact {
  dataset_id: number;
  id: number;
  validation_artifacts: ValidationArtifacts;
}

export interface ModelDatasetInfo {
  id: string;
  dataset_name: string;
  description: string | null;
  data_source_type: DatesetType;
  train_and_inference_type: number; // It's probably an enum, but I don't know the values
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
