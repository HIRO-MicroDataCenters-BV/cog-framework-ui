import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';

import {
  GetValidationArtifactsParams,
  ValidationArtifactsData,
  ValidationArtifactsResponse,
} from '../../model/ValidationArtifacts';
import {
  GetValidationMetricsParams,
  ValidationMetricsData,
} from '../../model/ValidationMetrics';
import { ActivatedRoute, Router } from '@angular/router';
import { ModelValidationService } from '../../service/model-validation.service';
import { PAGE_SIZE_OPTIONS, RESPONSE_CODE } from 'src/app/constants';
import {
  AppSearcherComponent,
  SearcherEvent,
  SearcherOption,
} from 'src/app/components/app-searcher/app-searcher.component';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe, NgIf } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { GetModelParams } from 'src/app/model/ModelInfo';

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
  standalone: true,
  imports: [
    MatCardModule,
    MatProgressBarModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    DecimalPipe,
    AppSearcherComponent,
    TranslocoPipe,
    NgIf,
  ],
  templateUrl: './model-validation-search.component.html',
  styleUrls: ['./model-validation-search.component.scss'],
})
export class ModelValidationSearchComponent implements OnInit, AfterViewInit {
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

  modelValidationMetricTableDataSource = new MatTableDataSource();
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

  pageSizeOptions = PAGE_SIZE_OPTIONS;

  limitMetrics = this.pageSizeOptions[0];
  pageMetrics = 1;
  totalMetrics = 0;

  searchOptions: SearcherOption[] = [
    { key: 'name', label: 'Model Name', inputType: 'text' },
    { key: 'id', label: 'Model Id', inputType: 'number' },
  ];
  defaultSearchQuery = '';
  defaultSearchOptionKey = '';

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private router: Router,
    private modelValidationService: ModelValidationService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['model_name']) {
        this.modelValidationName = params['model_name'];
      }
      if (params['model_id']) {
        this.modelValidationId = params['model_id'];
      }
      this.getModelValidationArtifacts({ ...params });
      this.getModeValidationMetrics({ ...params });
    });
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.modelValidationMetricTableDataSource.paginator = this.paginator;
    }
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

  search(event: SearcherEvent = { key: 'name', query: '' }): void {
    const params: GetModelParams = event.query
      ? { [event.key]: event.query }
      : {};
    const i = (this.paginator?.pageIndex as number) ?? 0;
    this.pageMetrics = i + 1;
    this.limitMetrics = params?.pageSize ?? this.limitMetrics;
    params.limit = this.paginator?.pageSize ?? this.limitMetrics;
    params.page = this.pageMetrics;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'replace',
    });

    /*
    let params: GetValidationArtifactsParams = {
      model_name: this.modelValidationName,
    };
    if (this.modelValidationId.length > 0) {
      params = { model_id: this.modelValidationId };
    }
    */
    /*
    const i = (this.paginator?.pageIndex as number) ?? 0;

    this.page = i + 1;
    this.limit = params?.pageSize ?? this.limit;
    params.limit = this.paginator?.pageSize ?? this.limit;
    params.page = this.page;
    */
    /*
    if (this.modelValidationId.length > 0) {
      console.log('Search by ID');
      this.getModelValidationArtifactByID();
      this.getModeValidationMetricsById();
    } else {
      console.log('Search by Name');
      this.getModelValidationArtifactByName();
      this.getModeValidationMetricsByName();
    }
      */
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'replace',
    });
  }
  getModelValidationArtifacts(params: GetValidationArtifactsParams = {}): void {
    this.loading = true;
    const response =
      this.cogFrameworkApiService.getModelValidationArtifacts(params);

    response.subscribe({
      next: (res) => {
        this.validationArtifactsResponse = res;
        this.modelValidationTableDataSource = [];
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
        if (e.status === RESPONSE_CODE.NOT_FOUND) {
          this.modelValidationTableDataSource = [];
        }
        this.loading = false;
      },
      complete: () => {
        console.info('complete');
        this.loading = false;
      },
    });
  }
  getModeValidationMetrics(params: GetValidationMetricsParams): void {
    const response =
      this.cogFrameworkApiService.getModelValidationMetrics(params);

    response.subscribe({
      next: (v) => {
        this.modelValidationMetricTableDataSource.data = v.data;
      },
      error: (e) => {
        console.error(e);
        if (e.status === RESPONSE_CODE.NOT_FOUND) {
          this.modelValidationMetricTableDataSource.data = [];
        }
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
  /*
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
  */

  buildModelValidationMetrics(
    validationMetricsData: ValidationMetricsData[],
  ): void {
    console.log('v', validationMetricsData);
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

      this.modelValidationMetricTableDataSource.data.push(d);
      console.log('data', d, this.modelValidationMetricTableDataSource);
    });
  }
}
