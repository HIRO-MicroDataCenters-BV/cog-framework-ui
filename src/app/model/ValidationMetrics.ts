export interface ValidationMetricsResponse {
    data: ValidationMetricsData[]
    errors: any
    message: string
    success: boolean
}

export interface ValidationMetricsData {
    accuracy_score: number
    dataset_id: number
    example_count: number
    f1_score: number
    id: number
    log_loss: number
    model_id: number
    precision_score: number
    recall_score: number
    registered_date_time: string
    roc_auc: number
    score: number
}

export interface ModelValidationMetricTableModel {
    registered_date_time: string;
    dataset_id: Number
    id: Number
    accuracy_score: Number
    example_count: Number
    f1_score: Number
    log_loss: Number
    precision_score: Number
    recall_score: Number
    roc_auc: Number
    score: Number
}
