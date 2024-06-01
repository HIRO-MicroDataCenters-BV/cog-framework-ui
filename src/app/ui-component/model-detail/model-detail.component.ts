import {Component} from '@angular/core';
import {CogFrameworkApiService} from "../../service/cog-framework-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatCardModule} from "@angular/material/card";
import {MatListModule} from "@angular/material/list";
import {
    DatasetInfo,
    ModelDetailData,
    ModelDetailInfo,
    ModelFileInfo,
    ModelValidationTableModel, ValidationArtifact
} from "../../model/ModelDetails";
import {MatTableModule} from "@angular/material/table";
import {DemoMaterialModule} from "../../demo-material-module";
import {NgIf} from "@angular/common";
import {ModelValidationService} from "../../service/model-validation.service";
import {ModelValidationMetricTableModel, ValidationMetricsData} from "../../model/ValidationMetrics";


@Component({
    selector: 'app-model-detail',
    standalone: true,
    imports: [
        MatCardModule,
        MatListModule,
        MatTableModule,
        DemoMaterialModule,
        NgIf
    ],
    templateUrl: './model-detail.component.html',
    styleUrl: './model-detail.component.scss'
})
export class ModelDetailComponent {

    modelId = "1";
    modelDetail: ModelDetailInfo | undefined;
    modelDetailData: ModelDetailData | undefined;

    displayedColumns: string[] = ['id', 'action'];
    dataSetDataSource: DatasetInfo[] = [];
    modelFileDataSource: ModelFileInfo[] = [];
    errMsg = undefined;

    validation_artifacts: ValidationArtifact[] = [];
    modelValidationTableDataSource: ModelValidationTableModel[] = [];
    displayedColumnsModelValidationTable: string[] = ['id', 'dataset_id', 'model_id', 'action']

    modelValidationMetricTableDataSource: ModelValidationMetricTableModel[] = [];
    modelValidationMetricTableDisplayedColumns: string[] = ['id', 'dataset_id', 'accuracy_score', 'example_count', 'f1_score', 'log_loss', 'precision_score', 'recall_score', 'roc_auc', 'score'];

    constructor(private cogFrameworkApiService: CogFrameworkApiService, private activatedRoute: ActivatedRoute,
                private router: Router, private modelValidationService: ModelValidationService) {
        console.log(this.activatedRoute.snapshot.queryParams['id'])
        if (this.activatedRoute.snapshot.queryParams['id']) {
            this.modelId = this.activatedRoute.snapshot.queryParams['id'];
        }
        this.modeDetails();
    }

    modeDetails(): void {
        console.log("search model with name " + this.modelId)
        const response = this.cogFrameworkApiService.getModelDetailById(this.modelId);

        response.subscribe({
            next: (v) => {
                //console.log(v)
                // temp
                console.log(v.data[0])
                this.modelDetailData = v.data[0]
                this.modelDetail = v;
                this.dataSetDataSource = v.data[0].datasets;
                this.modelFileDataSource = v.data[0].model_files
                this.errMsg = undefined;

                this.validation_artifacts = v.data[0].validation_artifacts;
                this.buildModelValidationArtifacts(this.validation_artifacts);
                this.buildModelValidationMetrics(v.data[0].validation_metrics);

            },
            error: (e) => {
                console.log('error----->')
                console.error(e)
                console.error(e.status)
                console.error(e.error.error)
                if (e.status === 404) {
                    this.errMsg = e.error.error
                }
                // this.loading = false;
            },
            complete: () => {
                //this.loading = false;
                console.info('complete')
            }
        })
    }

    back(): void {
        this.router.navigate(['/model'])
            .then(r => {
            });
    }

    open(item: any): void {
        // this.validationArtifactsResponse?.data.forEach(res => {
        //     if (item.id === res.id) {
        //         this.modelValidationService.modelValidationArtifactsData = res;
        //     }
        // })

        this.validation_artifacts.forEach(res => {
            // if (item.id === res.id) {
            //     this.modelValidationService.modelValidationArtifactsData = res;
            // }
        })

        this.router.navigate(['/model-validation-artifacts'])
            .then(r => {
                console.log("redirected to other component")
            });
    }

    buildModelValidationArtifacts(validationArtifacts: ValidationArtifact[]): void {
        validationArtifacts.forEach(data => {
            const dd: ModelValidationTableModel = {
                id: 1,
                dataset_id: data.dataset_id,
                // @ts-ignore
                model_id: this.modelDetailData?.model_id
            }
            this.modelValidationTableDataSource.push(dd)
        })
    }

    buildModelValidationMetrics(validationMetricsData: ValidationMetricsData[]): void {
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
}
