import { Component } from '@angular/core';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import {
  DatasetInfo,
  ModelDetailData,
  ModelDetailInfo,
  ModelFileInfo,
  ModelValidationTableModel,
  ValidationArtifact,
} from '../../model/ModelDetails';
import { MatTableModule } from '@angular/material/table';
import { DemoMaterialModule } from '../../demo-material-module';
import { DatePipe, NgIf } from '@angular/common';
import { ModelValidationService } from '../../service/model-validation.service';
import {
  ModelPipelineTableModel,
  Pipeline,
  ValidationMetricsData,
  ValidationMetricTableData,
} from '../../model/ValidationMetrics';
import { ValidationArtifactsData } from '../../model/ValidationArtifacts';
import { ModelUploadComponent } from '../model-upload/model-upload.component';
import { ModelFileData } from '../../model/ModelFile';

@Component({
  selector: 'app-model-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatListModule,
    MatTableModule,
    DemoMaterialModule,
    NgIf,
    DatePipe,
    ModelUploadComponent,
  ],
  templateUrl: './model-detail.component.html',
  styleUrl: './model-detail.component.scss',
})
export class ModelDetailComponent {
  modelId = '';
  modelDetail: ModelDetailInfo | undefined;
  modelDetailData: ModelDetailData | undefined;

  displayedColumns: string[] = ['id', 'action'];
  dataSetDataSource: DatasetInfo[] = [];
  modelFileDataSource: ModelFileInfo[] = [];
  errMsg = undefined;

  validation_artifacts: ValidationArtifactsData[] = [];
  modelValidationTableDataSource: ModelValidationTableModel[] = [];
  displayedColumnsModelValidationTable: string[] = [
    'id',
    'dataset_id',
    'model_id',
    'action',
  ];

  modelValidationMetricTableDataSource: ValidationMetricTableData[] = [];
  modelValidationMetricTableDisplayedColumns: string[] = [
    'id',
    'dataset_id',
    'accuracy_score',
    'example_count',
    'f1_score',
    'log_loss',
    'precision_score',
    'recall_score',
    'roc_auc',
    'score',
  ];

  modelPipelineTableTableDataSource: ModelPipelineTableModel[] = [];
  displayedColumnsModelPipeLineTable: string[] = [
    'name',
    'description',
    'created_at',
  ];

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modelValidationService: ModelValidationService,
  ) {
    if (this.activatedRoute.snapshot.queryParams['id']) {
      this.modelId = this.activatedRoute.snapshot.queryParams['id'];
    }
    this.modelDetails();
  }

  modelDetails(): void {
    const response = this.cogFrameworkApiService.getModelDetailById(
      this.modelId,
    );

    response.subscribe({
      next: (v) => {
        this.modelDetailData = v.data[0];
        this.modelDetail = v;
        this.dataSetDataSource = v.data[0].datasets;
        this.modelFileDataSource = v.data[0].model_files;
        this.errMsg = undefined;
        this.validation_artifacts = v.data[0].validation_artifacts;
        this.buildModelValidationArtifacts(this.validation_artifacts);
        this.buildModelValidationMetrics(v.data[0].validation_metrics);
        if (v.data[0].pipelines) {
          this.buildModelPipelineDataSource(v.data[0].pipelines);
        }
      },
      error: (e) => {
        console.error(e);
        if (e.status === 404) {
          this.errMsg = e.error.error;
        }
        // this.loading = false;
      },
      complete: () => {
        //this.loading = false;
        console.info('complete');
      },
    });
  }

  back(): void {
    this.router.navigate(['/model']).then(() => {});
  }

  open(item: ValidationArtifactsData): void {
    console.log('item', item);
    this.validation_artifacts?.forEach((res) => {
      if (item.id === res.id) {
        this.modelValidationService.modelValidationArtifactsData = res;
      }
    });
    this.router.navigate(['/model-validation-artifacts']).then(() => {
      this.modelValidationService.previousComponentUrl = '/model-detail';
      this.modelValidationService.previousComponentUrlQuery =
        this.activatedRoute.snapshot.queryParams['id'];
    });
  }

  buildModelValidationArtifacts(
    validationArtifacts: ValidationArtifact[],
  ): void {
    validationArtifacts.forEach((data) => {
      const dd: ModelValidationTableModel = {
        id: data.id,
        dataset_id: data.dataset_id,
        model_id: this.modelDetailData?.model_id as number,
      };
      this.modelValidationTableDataSource.push(dd);
    });
  }

  buildModelValidationMetrics(
    validationMetricsData: ValidationMetricsData[],
  ): void {
    validationMetricsData.forEach(({ model_id: _model_id, ...rest }) => {
      this.modelValidationMetricTableDataSource.push(rest);
    });
  }

  buildModelPipelineDataSource(pipelines: Pipeline[]): void {
    pipelines.forEach((pipeline) => {
      const data: ModelPipelineTableModel = {
        name: pipeline.name,
        description: pipeline.description,
        createdAt: pipeline.created_at,
      };
      this.modelPipelineTableTableDataSource.push(data);
    });
  }

  updateModelFile(modelFile: ModelFileData): void {
    this.modelFileDataSource = [
      ...this.modelFileDataSource,
      {
        file_id: `${modelFile.id}`,
        file_name: modelFile.file_name,
      },
    ];
  }
}
