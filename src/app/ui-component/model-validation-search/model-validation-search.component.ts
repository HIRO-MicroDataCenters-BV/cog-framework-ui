import {Component, OnDestroy, OnInit} from '@angular/core';
import {CogFrameworkApiService} from "../../service/cog-framework-api.service";

import {
    ValidationArtifactsResponse
} from "../../model/ValidationArtifacts";
import {ModelValidationMetricTableModel, ValidationMetricsData} from "../../model/ValidationMetrics";
import {Router} from "@angular/router";
import {ModelValidationService} from "../../service/model-validation.service";
import {ModelValidationTableModel} from "../../model/ModelDetails";

interface ModelValidationTable {
    name: String;
    value: Number;
}

@Component({
    selector: 'app-model-validation-search',
    templateUrl: './model-validation-search.component.html',
    styleUrls: ['./model-validation-search.component.scss']
})
export class ModelValidationSearchComponent implements OnInit, OnDestroy {

    modelValidationName = "Federated Learning";
    modelValidationId = "";

    validationMetricsData: ValidationMetricsData | undefined;
    validationArtifactsResponse: ValidationArtifactsResponse | undefined;

    loading = false;

    modelValidationTableDataSource: ModelValidationTableModel[] = [];
    displayedColumnsModelValidationTable: string[] = ['id', 'dataset_id', 'model_id', 'action']

    modelValidationScoreTableSource: ModelValidationTable[] = [];
    displayedColumns: string[] = ['name', 'value'];

    modelValidationMetricTableDataSource: ModelValidationMetricTableModel[] = [];
    modelValidationMetricTableDisplayedColumns: string[] = ['id', 'dataset_id', 'accuracy_score', 'example_count', 'f1_score', 'log_loss', 'precision_score', 'recall_score', 'roc_auc', 'score'];

    constructor(private cogFrameworkApiService: CogFrameworkApiService, private router: Router, private modelValidationService: ModelValidationService) {
        // this.getModelValidationArtifactByID();
    }

    open(item: any): void {
        this.validationArtifactsResponse?.data.forEach(res => {
            if (item.id === res.id) {
                this.modelValidationService.modelValidationArtifactsData = res;
            }
        })
        this.modelValidationService.previousComponentUrl = '/model-validation';
        this.router.navigate(['/model-validation-artifacts'], {queryParams: {id: item.id}})
            .then(r => {
            });
    }

    search(): void {
        if (this.modelValidationId.length > 0) {
            this.getModelValidationArtifactByID();
            this.getModeValidationMetricsById();
        } else {
            this.getModelValidationArtifactByName();
            this.getModeValidationMetricsByName();
        }
    }

    getModelValidationArtifactByID(): void {
        this.loading = true;
        const response = this.cogFrameworkApiService.getModelValidationArtifactById(this.modelValidationId);

        response.subscribe({
            next: (res) => {

                this.validationArtifactsResponse = res;
                res.data.forEach(data => {
                    const dd: ModelValidationTableModel = {
                        id: data.id,
                        dataset_id: data.dataset_id,
                        model_id: data.model_id
                    }
                    this.modelValidationTableDataSource.push(dd)
                })
            },
            error: (e) => {
                console.error(e)

            },
            complete: () => {
                console.info('complete')
                this.loading = false;
            }
        })
    }

    getModelValidationArtifactByName(): void {
        this.loading = true;
        const response = this.cogFrameworkApiService.getModelValidationArtifactByName(this.modelValidationName);

        response.subscribe({
            next: (res) => {

                this.validationArtifactsResponse = res;
                res.data.forEach(data => {
                    const dd: ModelValidationTableModel = {
                        id: data.id,
                        dataset_id: data.dataset_id,
                        model_id: data.model_id
                    }
                    this.modelValidationTableDataSource.push(dd)
                })
            },
            error: (e) => {
                console.error(e)
            },
            complete: () => {
                this.loading = false;
            }
        })
    }


    getModeValidationMetricsById(): void {
        const response = this.cogFrameworkApiService.getModelValidationMetricsById(this.modelValidationId);

        response.subscribe({
            next: (v) => {
                this.validationMetricsData = v.data[0];
                this.buildModelValidationMetrics(this.validationMetricsData)
                this.buildModelValidationMetricsV2(v.data);
            },
            error: (e) => {
                console.error(e)

            },
            complete: () => {
            }
        })
    }

    getModeValidationMetricsByName(): void {
        const response = this.cogFrameworkApiService.getModelValidationMetricsByName(this.modelValidationName);

        response.subscribe({
            next: (v) => {
                this.validationMetricsData = v.data[0];
                this.buildModelValidationMetrics(this.validationMetricsData)
                this.buildModelValidationMetricsV2(v.data);
            },
            error: (e) => {
                console.error(e)

            },
            complete: () => {
            }
        })
    }

    buildModelValidationMetricsV2(validationMetricsData: ValidationMetricsData[]): void {
        validationMetricsData.forEach(data => {
            const d: ModelValidationMetricTableModel = {
                registered_date_time: data.registered_date_time,
                id: data.id,
                dataset_id: data.dataset_id,
                accuracy_score: data.accuracy_score,
                example_count: data.example_count,
                f1_score: data.f1_score,
                log_loss: data.log_loss,
                precision_score: data.precision_score,
                recall_score: data.recall_score,
                roc_auc: data.roc_auc,
                score: data.score
            }
            this.modelValidationMetricTableDataSource.push(d);
        })
    }

    buildModelValidationMetrics(validationMetricsData: ValidationMetricsData): void {
        this.modelValidationScoreTableSource.push({
            "name": "accuracy_score",
            "value": validationMetricsData.accuracy_score
        });
        this.modelValidationScoreTableSource.push({
            "name": "example_count",
            "value": validationMetricsData.example_count
        });

        this.modelValidationScoreTableSource.push({
            "name": "f1_score",
            "value": validationMetricsData.f1_score
        });

        this.modelValidationScoreTableSource.push({
            "name": "log_loss",
            "value": validationMetricsData.log_loss
        });

        this.modelValidationScoreTableSource.push({
            "name": "precision_score",
            "value": validationMetricsData.precision_score
        });

        this.modelValidationScoreTableSource.push({
            "name": "recall_score",
            "value": validationMetricsData.recall_score
        });

        this.modelValidationScoreTableSource.push({
            "name": "roc_auc",
            "value": validationMetricsData.roc_auc
        });

        this.modelValidationScoreTableSource.push({"name": "score", "value": validationMetricsData.score});
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }

}
