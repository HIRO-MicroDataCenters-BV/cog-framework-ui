import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ModelValidationService } from '../../service/model-validation.service';
import {
  ValidationArtifacts,
  ValidationArtifactsData,
} from '../../model/ValidationArtifacts';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { Router } from '@angular/router';
import { buildImgURL } from '../../utils';

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
  selector: 'app-model-validation-artifacts',
  templateUrl: './model-validation-artifacts.component.html',
  styleUrls: ['./model-validation-artifacts.component.scss'],
})
export class ModelValidationArtifactsComponent implements OnInit {
  data: ValidationArtifactsData | undefined;
  validationArtifacts: ValidationArtifacts | undefined;

  shap_summary_plot: string | undefined;

  modelValidationMetricTableSource: ModelValidationMetricTable[] = [];

  csvData: string | undefined;
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

  backURL: string | undefined;
  backURLQuery: string | undefined;

  constructor(
    private modelValidationService: ModelValidationService,
    private cogFrameworkApiService: CogFrameworkApiService,
    private router: Router,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.data = this.modelValidationService.modelValidationArtifactsData;
    console.log('data', this.data);

    if (this.data) {
      this.validationArtifacts = this.data.validation_artifacts;
      this.modeValidationCsv(this.validationArtifacts?.per_class_metrics);
    }

    this.backURL = this.modelValidationService.previousComponentUrl;
    this.backURLQuery = this.modelValidationService.previousComponentUrlQuery;
  }

  buildImgURL(url?: string): string {
    if (!url) {
      return '';
    }
    return buildImgURL(url);
  }

  modeValidationCsv(csvFileS3Url: string | undefined): void {
    if (csvFileS3Url) {
      const response =
        this.cogFrameworkApiService.getModelValidationCSV(csvFileS3Url);
      response.subscribe({
        next: (data) => {
          this.csvData = data;
          const lst = data.split('\n');
          console.log(lst);
          lst.forEach((e: string) => {
            const csvData = e.split(',');
            if (csvData[1] != undefined && csvData[0] != 'positive_class') {
              const d: ModelValidationMetricTable = {
                positive_class: Number(csvData[0]),
                true_negatives: Number(csvData[1]),
                false_positives: Number(csvData[2]),
                false_negatives: Number(csvData[3]),
                true_positives: Number(csvData[4]),
                example_count: Number(csvData[5]),
                accuracy_score: Number(csvData[6]),
                recall_score: Number(csvData[7]),
                precision_score: Number(csvData[8]),
                f1_score: Number(csvData[9]),
                roc_auc: Number(csvData[10]),
                precision_recall_auc: Number(csvData[11]),
              };
              this.modelValidationMetricTableSource.push(d);
            }
          });
        },
        error: (e) => {
          console.error(e);
        },
        complete: () => {
          console.info('complete');
        },
      });
    }
  }

  back(): void {
    if (this.backURL === '/model-detail') {
      this.router
        .navigate([this.backURL], { queryParams: { id: this.backURLQuery } })
        .then((r) => {
          console.log(r);
        });
    } else {
      this.location.back();
    }
  }
}
