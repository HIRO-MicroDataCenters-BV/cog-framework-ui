export interface ValidationMetricsResponse {
  data: ValidationMetricsData[];
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}

export type ValidationMetricsData = ValidationMetricTableData & {
  model_id: number;
};

export type ValidationMetricTableData = {
  registered_date_time: string;
  dataset_id: number;
  id: number;
  accuracy_score: number;
  example_count: number;
  f1_score: number;
  log_loss: number;
  precision_score: number;
  recall_score: number;
  roc_auc: number;
  score: number;
};

export interface ModelPipelineTableModel {
  name: string;
  description: string;
  createdAt: string;
}

export interface Pipeline {
  name: string;
  uuid: string;
  description: string;
  created_at: string;
}

export type GetValidationMetricsParams = {
  model_id?: string;
  model_name?: string;
};
