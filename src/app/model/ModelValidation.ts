export interface ModelValidation {
  score: number;
  example_count: number;
  accuracy_score: number;
  recall_score: number;
  precision_score: number;
  f1_score: number;
  log_loss: number;
  roc_auc: number;
}
