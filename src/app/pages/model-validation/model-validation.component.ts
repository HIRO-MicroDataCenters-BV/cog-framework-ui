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

  csvData: string | undefined;
  validationMetricsData: ValidationMetricsData | undefined;
  validationArtifactsResponse: ValidationArtifactsResponse | undefined;
  validationArtifactsData: ValidationArtifactsData | undefined;

  baseURL = environment.appURL + '/s/get_image?url=';
  confusion_matrix: string | undefined;
  per_class_metrics: string | undefined;
  precision_recall_curve_plot: string | undefined;
  roc_curve_plot: string | undefined;
  shap_beeswarm_plot: string | undefined;
  shap_feature_importance_plot: string | undefined;
  shap_summary_plot: string | undefined;

  image: string | undefined;
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
    const response = this.cogFrameworkApiService.getModelValidationArtifacts({
      model_name: this.modelValidationName,
    });

    response.subscribe({
      next: (v) => {
        this.validationArtifactsResponse = v;
        this.validationArtifactsData = v.data[0];
        console.log(this.validationArtifactsResponse);
        if (this.validationArtifactsData) {
          this.buildImgURL(this.validationArtifactsData);
        }
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
    const response = this.cogFrameworkApiService.getModelValidationArtifacts({
      model_id: this.modelValidationId,
    });

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
    const response = this.cogFrameworkApiService.getModelValidationMetrics({
      model_id: this.modelValidationId,
    });

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
    const response = this.cogFrameworkApiService.getModelValidationMetrics({
      model_name: this.modelValidationName,
    });

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
        lst.forEach((e: string) => {
          const csvData = e.split(',');
          if (csvData[1] != undefined && csvData[0] != 'positive_class') {
            const row = csvData.map((row: string) => parseFloat(row));
            const d: ModelValidationMetricTable = {
              positive_class: row[0],
              true_negatives: row[1],
              false_positives: row[1],
              false_negatives: row[1],
              true_positives: row[1],
              example_count: row[1],
              accuracy_score: row[1],
              recall_score: row[1],
              precision_score: row[1],
              f1_score: row[1],
              roc_auc: row[1],
              precision_recall_auc: row[1],
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
      validationArtifactsData.validation_artifacts.confusion_matrix;
    console.log(this.confusion_matrix);
    this.per_class_metrics =
      this.baseURL +
      validationArtifactsData.validation_artifacts.per_class_metrics;

    this.precision_recall_curve_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.precision_recall_curve_plot;
    this.roc_curve_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.roc_curve_plot;
    this.shap_beeswarm_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.shap_beeswarm_plot;
    this.shap_feature_importance_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.shap_feature_importance_plot;
    this.shap_summary_plot =
      this.baseURL +
      validationArtifactsData.validation_artifacts.shap_summary_plot;
    if (validationArtifactsData.validation_artifacts.per_class_metrics) {
      this.modeValidationCsv(
        validationArtifactsData.validation_artifacts.per_class_metrics,
      );
    }
  }
}
