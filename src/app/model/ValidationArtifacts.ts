export interface ValidationArtifactsResponse {
  data: ValidationArtifactsData[];
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}

export interface ValidationArtifactsData {
  dataset_id: number;
  id: number;
  model_id: number;
  validation_artifacts: ValidationArtifacts;
}

export interface ValidationArtifacts {
  confusion_matrix?: string;
  per_class_metrics?: string;
  precision_recall_curve_plot?: string;
  roc_curve_plot?: string;
  shap_beeswarm_plot?: string;
  shap_feature_importance_plot?: string;
  shap_summary_plot?: string;
}
