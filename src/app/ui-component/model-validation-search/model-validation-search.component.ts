import { Component } from '@angular/core';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';

import {
  ValidationArtifactsData,
  ValidationArtifactsResponse,
} from '../../model/ValidationArtifacts';
import { ValidationMetricsData } from '../../model/ValidationMetrics';
import { Router } from '@angular/router';
import { ModelValidationService } from '../../service/model-validation.service';

interface ValidationMetricTableData {
  registered_date_time: string;
  dataset_id: number;
  id: number;
  accuracy_score: number;
  example_count: number;
  f1_score: number;
  log_loss: number;
  precision_score: number;
  recall_score: number;
  roc_auc: number;
  score: number;
}

interface ModelValidationTable {
  name: string;
  value: number;
}

interface ModelValidationTableModel {
  id: number;
  dataset_id: number;
  model_id: number;
}

@Component({
  selector: 'app-model-validation-search',
  templateUrl: './model-validation-search.component.html',
  styleUrls: ['./model-validation-search.component.scss'],
})
export class ModelValidationSearchComponent {
  modelValidationName = '';
  modelValidationId = '';

  validationMetricsData: ValidationMetricsData | undefined;
  validationArtifactsResponse: ValidationArtifactsResponse | undefined;

  loading = false;

  modelValidationTableDataSource: ModelValidationTableModel[] = [];
  displayedColumnsModelValidationTable: string[] = [
    'id',
    'dataset_id',
    'model_id',
    'action',
  ];

  modelValidationScoreTableSource: ModelValidationTable[] = [];
  displayedColumns: string[] = ['name', 'value'];

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

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private router: Router,
    private modelValidationService: ModelValidationService,
  ) {
    // TODO: I'm not sure what this is supposed to do, maybe it will work after api update
    // this.search();
  }

  open(item: ValidationArtifactsData): void {
    this.validationArtifactsResponse?.data.forEach((res) => {
      if (item.id === res.id) {
        this.modelValidationService.modelValidationArtifactsData = res;
      }
    });
    this.router
      .navigate(['/model-validation-artifacts'], {
        queryParams: { id: item.id },
      })
      .then(() => {
        console.log('redirected to other component');
      });
  }

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

  getModelValidationArtifactByID(): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getModelValidationArtifactById(
      this.modelValidationId,
    );

    response.subscribe({
      next: (res) => {
        this.validationArtifactsResponse = res;
        res.data.forEach((data) => {
          const dd: ModelValidationTableModel = {
            id: data.id,
            dataset_id: data.dataset_id,
            model_id: data.model_id,
          };
          this.modelValidationTableDataSource.push(dd);
        });
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      },
      complete: () => {
        console.info('complete');
        this.loading = false;
      },
    });
  }

  getModelValidationArtifactByName(): void {
    this.loading = true;
    const response =
      this.cogFrameworkApiService.getModelValidationArtifactByName(
        this.modelValidationName,
      );

    response.subscribe({
      next: (res) => {
        this.validationArtifactsResponse = res;
        res.data.forEach((data) => {
          const dd: ModelValidationTableModel = {
            id: data.id,
            dataset_id: data.dataset_id,
            model_id: data.model_id,
          };
          this.modelValidationTableDataSource.push(dd);
        });
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
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
        this.buildModelValidationMetrics(v.data);
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
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
        this.buildModelValidationMetrics(v.data);
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  buildModelValidationMetrics(
    validationMetricsData: ValidationMetricsData[],
  ): void {
    validationMetricsData.forEach((data) => {
      const d: ValidationMetricTableData = {
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
        score: data.score,
      };
      this.modelValidationMetricTableDataSource.push(d);
    });
  }
}
