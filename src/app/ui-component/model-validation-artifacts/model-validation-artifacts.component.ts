import {Component, Input, OnInit} from '@angular/core';
import {ModelValidationService} from "../../service/model-validation.service";
import {ValidationArtifactsData} from "../../model/ValidationArtifacts";
import {environment} from "../../../environments/environment";
import {CogFrameworkApiService} from "../../service/cog-framework-api.service";
import {Router} from "@angular/router";

interface ModelValidationMetricTable {
    positive_class: Number;
    true_negatives: Number;
    false_positives: Number;
    false_negatives: Number;
    true_positives: Number;
    example_count: Number;
    accuracy_score: Number;
    recall_score: Number;
    precision_score: Number;
    f1_score: Number;
    roc_auc: Number;
    precision_recall_auc: Number;
}

@Component({
    selector: 'app-model-validation-artifacts',
    templateUrl: './model-validation-artifacts.component.html',
    styleUrls: ['./model-validation-artifacts.component.scss']
})
export class ModelValidationArtifactsComponent implements OnInit {

    data: ValidationArtifactsData | undefined;

    baseURL = environment.appURL + '/s3/get_image?url=';
    confusion_matrix: any;
    //per_class_metrics: any
    precision_recall_curve_plot: any
    roc_curve_plot: any
    shap_beeswarm_plot: any
    shap_feature_importance_plot: any
    shap_summary_plot: any

    modelValidationMetricTableSource: ModelValidationMetricTable[] = [];

    csvData: any | undefined;
    displayedColumnsMetricsTable: string[] = ['positive_class', 'true_negatives', 'false_positives', 'false_negatives',
        'true_positives', 'example_count', 'accuracy_score', 'recall_score', 'precision_score', 'f1_score', 'roc_auc', 'precision_recall_auc'];

    backURL: any;
    backURLQuery: any;

    constructor(private modelValidationService: ModelValidationService,
                private cogFrameworkApiService: CogFrameworkApiService, private router: Router) {
    }

    ngOnInit(): void {
        this.data = this.modelValidationService.modelValidationArtifactsData;
        if (this.data) {
            this.buildImgURL(this.data)
        }
        this.backURL = this.modelValidationService.previousComponentUrl;
        this.backURLQuery = this.modelValidationService.previousComponentUrlQuery;
    }

    buildImgURL(validationArtifactsData: ValidationArtifactsData): void {

        this.confusion_matrix = this.baseURL + validationArtifactsData.validation_artifacts.confusion_matrix.uri;
        this.precision_recall_curve_plot = this.baseURL + validationArtifactsData.validation_artifacts.precision_recall_curve_plot.uri;
        this.roc_curve_plot = this.baseURL + validationArtifactsData.validation_artifacts.roc_curve_plot.uri;
        this.shap_beeswarm_plot = this.baseURL + validationArtifactsData.validation_artifacts.shap_beeswarm_plot.uri;
        this.shap_feature_importance_plot = this.baseURL + validationArtifactsData.validation_artifacts.shap_feature_importance_plot.uri;
        this.shap_summary_plot = this.baseURL + validationArtifactsData.validation_artifacts.shap_summary_plot.uri;
        this.modeValidationCsv(validationArtifactsData.validation_artifacts.per_class_metrics.uri)
    }

    modeValidationCsv(csvFileS3Url: string): void {
        const response = this.cogFrameworkApiService.getModelValidationCSV(csvFileS3Url);
        response.subscribe({
            next: (data) => {
                this.csvData = data;
                this.modelValidationService = data;
                const lst = data.split('\n');
                lst.forEach((e: any) => {
                    const csvData = e.split(',');
                    if (csvData[1] != undefined && csvData[0] != 'positive_class') {
                        const d: ModelValidationMetricTable = {
                            positive_class: csvData[0],
                            true_negatives: csvData[1],
                            false_positives: csvData[1],
                            false_negatives: csvData[1],
                            true_positives: csvData[1],
                            example_count: csvData[1],
                            accuracy_score: csvData[1],
                            recall_score: csvData[1],
                            precision_score: csvData[1],
                            f1_score: csvData[1],
                            roc_auc: csvData[1],
                            precision_recall_auc: csvData[1]
                        }
                        this.modelValidationMetricTableSource.push(d)
                    }
                })
            },
            error: (e) => {
                console.error(e)
            },
            complete: () => {
                console.info('complete')
            }
        })
    }

    back(): void {
        if (this.backURL === '/model-detail') {
            this.router.navigate([this.backURL], {queryParams: {id: this.backURLQuery}})
                .then(r => {
                });
        } else {
            this.router.navigate([this.backURL])
                .then(r => {
                });
        }
    }
}
