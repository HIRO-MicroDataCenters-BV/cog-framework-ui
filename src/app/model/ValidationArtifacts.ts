export interface ValidationArtifactsResponse {
    data: ValidationArtifactsData[]
    errors: any
    message: string
    success: boolean
}

export interface ValidationArtifactsData {
    dataset_id: number
    id: number
    model_id: number
    validation_artifacts: ValidationArtifacts
}

export interface ValidationArtifacts {
    confusion_matrix: ConfusionMatrix
    per_class_metrics: PerClassMetrics
    precision_recall_curve_plot: PrecisionRecallCurvePlot
    roc_curve_plot: RocCurvePlot
    shap_beeswarm_plot: ShapBeeswarmPlot
    shap_feature_importance_plot: ShapFeatureImportancePlot
    shap_summary_plot: ShapSummaryPlot
}

export interface ConfusionMatrix {
    uri: string
}

export interface PerClassMetrics {
    uri: string
}

export interface PrecisionRecallCurvePlot {
    uri: string
}

export interface RocCurvePlot {
    uri: string
}

export interface ShapBeeswarmPlot {
    uri: string
}

export interface ShapFeatureImportancePlot {
    uri: string
}

export interface ShapSummaryPlot {
    uri: string
}
