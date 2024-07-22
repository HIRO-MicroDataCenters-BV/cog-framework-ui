import { Component } from '@angular/core';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DemoMaterialModule } from '../../demo-material-module';
import { DecimalPipe, NgIf, NgOptimizedImage } from '@angular/common';

import {
  ValidationArtifactsData,
  ValidationArtifactsResponse,
} from '../../model/ValidationArtifacts';
import { ValidationMetricsData } from '../../model/ValidationMetrics';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

interface ModelValidationTable {
  name: string;
  value: number;
}

interface ModelValidationMetricTable {
  positive_class: number;
  true_negatives: number;
  false_positives: number;
  false_negatives: number;
  true_positives: number;
  example_count: number;
  accuracy_score: number;
  recall_score: number;
  precision_score: number;
  f1_score: number;
  roc_auc: number;
  precision_recall_auc: number;
}

@Component({
  selector: 'app-model-validation',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    DemoMaterialModule,
    NgOptimizedImage,
    NgIf,
    DecimalPipe,
    FormsModule,
  ],
  templateUrl: './model-validation.component.html',
  styleUrl: './model-validation.component.scss',
})
export class ModelValidationComponent {
  modelValidationName = '';
  modelValidationId = '1';

  csvData: any | undefined;
  validationMetricsData: ValidationMetricsData | undefined;
  validationArtifactsResponse: ValidationArtifactsResponse | undefined;
  validationArtifactsData: ValidationArtifactsData | undefined;

  baseURL = environment.appURL + '/s/get_image?url=';
  confusion_matrix: any;
  per_class_metrics: any;
  precision_recall_curve_plot: any;
  roc_curve_plot: any;
  shap_beeswarm_plot: any;
  shap_feature_importance_plot: any;
  shap_summary_plot: any;

  image: any;
  loading = false;
  modelValidationScoreTableSource: ModelValidationTable[] = [];
  displayedColumns: string[] = ['name', 'value'];

  modelValidationMetricTableSource: ModelValidationMetricTable[] = [];

  displayedColumnsMetricsTable: string[] = [
    'positive_class',
    'true_negatives',
    'false_positives',
    'false_negatives',
    'true_positives',
    'example_count',
    'accuracy_score',
    'recall_score',
    'precision_score',
    'f1_score',
    'roc_auc',
    'precision_recall_auc',
  ];

  constructor(private cogFrameworkApiService: CogFrameworkApiService) {}

  search(): void {
    if (this.modelValidationId.length > 0) {
      console.log('Search by ID');
      this.getModelValidationArtifactByID();
      this.getModeValidationMetricsById();
    } else {
      console.log('Search by Name');
      this.getModelValidationArtifactByName();
      this.getModeValidationMetricsByName();
    }
  }

  getModelValidationArtifactByName(): void {
    this.loading = true;
    const response =
      this.cogFrameworkApiService.getModelValidationArtifactByName(
        this.modelValidationName,
      );

    response.subscribe({
      next: (v) => {
        this.validationArtifactsResponse = v;
        this.validationArtifactsData = v.data[0];
        console.log(this.validationArtifactsResponse);
        this.buildImgURL(this.validationArtifactsData);
      },
      error: (e) => {
        console.error(e);
      },
      complete: () => {
        console.info('complete');
      },
    });
  }

  getModelValidationArtifactByID(): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getModelValidationArtifactById(
      this.modelValidationId,
    );

    response.subscribe({
      next: (v) => {
        this.validationArtifactsResponse = v;
        this.validationArtifactsData = v.data[0];
        this.buildImgURL(this.validationArtifactsData);
      },
      error: (e) => {
        console.error(e);
      },
      complete: () => {
        console.info('complete');
      },
    });
  }

  getModeValidationMetricsById(): void {
    const response = this.cogFrameworkApiService.getModelValidationMetricsById(
      this.modelValidationId,
    );

    response.subscribe({
      next: (v) => {
        this.validationMetricsData = v.data[0];
        this.buildModelValidationMetrics(this.validationMetricsData);
      },
      error: (e) => {
        console.error(e);
      },
      complete: () => {
        console.info('complete');
      },
    });
  }

  getModeValidationMetricsByName(): void {
    const response =
      this.cogFrameworkApiService.getModelValidationMetricsByName(
        this.modelValidationName,
      );

    response.subscribe({
      next: (v) => {
        this.validationMetricsData = v.data[0];
        this.buildModelValidationMetrics(this.validationMetricsData);
      },
      error: (e) => {
        console.error(e);
      },
      complete: () => {
        console.info('complete');
      },
    });
  }

  modeValidationCsv(csvFileS3Url: string): void {
    const response =
      this.cogFrameworkApiService.getModelValidationCSV(csvFileS3Url);
    response.subscribe({
      next: (data) => {
        this.csvData = data;
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
              precision_recall_auc: csvData[1],
            };
            this.modelValidationMetricTableSource.push(d);
          }
        });

        console.log(this.modelValidationMetricTableSource);
      },
      error: (e) => {
        console.error(e);
      },
      complete: () => {
        console.info('complete');
      },
    });
  }

  buildModelValidationMetrics(
    validationMetricsData: ValidationMetricsData,
  ): void {
    this.modelValidationScoreTableSource.push({
      name: 'accuracy_score',
      value: validationMetricsData.accuracy_score,
    });
    this.modelValidationScoreTableSource.push({
      name: 'example_count',
      value: validationMetricsData.example_count,
    });

    this.modelValidationScoreTableSource.push({
      name: 'f1_score',
      value: validationMetricsData.f1_score,
    });

    this.modelValidationScoreTableSource.push({
      name: 'log_loss',
      value: validationMetricsData.log_loss,
    });

    this.modelValidationScoreTableSource.push({
      name: 'precision_score',
      value: validationMetricsData.precision_score,
    });

    this.modelValidationScoreTableSource.push({
      name: 'recall_score',
      value: validationMetricsData.recall_score,
    });

    this.modelValidationScoreTableSource.push({
      name: 'roc_auc',
      value: validationMetricsData.roc_auc,
    });

    this.modelValidationScoreTableSource.push({
      name: 'score',
      value: validationMetricsData.score,
    });
  }

  buildImgURL(validationArtifactsData: ValidationArtifactsData): void {
    this.confusion_matrix =
      this.baseURL +
      validationArtifactsData.validation_artifacts.confusion_matrix.uri;
    console.log(this.confusion_matrix);
    this.per_class_metrics =
      this.baseURL +
      validationArtifactsData.validation_artifacts.per_class_metrics.uri;

    this.precision_recall_curve_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.precision_recall_curve_plot
        .uri;
    this.roc_curve_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.roc_curve_plot.uri;
    this.shap_beeswarm_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.shap_beeswarm_plot.uri;
    this.shap_feature_importance_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.shap_feature_importance_plot
        .uri;
    this.shap_summary_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.shap_summary_plot.uri;
    this.modeValidationCsv(
      validationArtifactsData.validation_artifacts.per_class_metrics.uri,
    );
  }
}
