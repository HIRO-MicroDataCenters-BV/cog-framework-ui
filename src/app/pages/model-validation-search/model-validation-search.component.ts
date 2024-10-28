import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';

import {
  GetValidationArtifactsParams,
  ValidationArtifactsData,
} from '../../model/ValidationArtifacts';
import { GetValidationMetricsParams } from '../../model/ValidationMetrics';
import { ActivatedRoute, Router } from '@angular/router';
import { ModelValidationService } from '../../service/model-validation.service';
import {
  DEF_SEARCH_PARAMS,
  PAGE_SIZE_OPTIONS,
  RESPONSE_CODE,
} from 'src/app/constants';
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
  pageSizeOptions = PAGE_SIZE_OPTIONS;
  searchOptions: SearcherOption[] = [...DEF_SEARCH_PARAMS];
  defaultSearchQuery = '';
  defaultSearchOptionKey = '';

  loading = false;

  dataSource = {
    metrics: new MatTableDataSource(),
    scores: new MatTableDataSource(),
    artifacts: new MatTableDataSource(),
  };
  displyedColumens = {
    metrics: [
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
    ],
    scores: ['name', 'value'],
    artifacts: ['id', 'dataset_id', 'model_id', 'action'],
  };
  pagigation = {
    metrics: {
      limit: this.pageSizeOptions[0],
      page: 1,
      total: 0,
    },
    scores: {
      limit: this.pageSizeOptions[0],
      page: 1,
      total: 0,
    },
    artifacts: {
      limit: this.pageSizeOptions[0],
      page: 1,
      total: 0,
    },
  };
  id = '';
  name = '';

  @ViewChild('paginatorMetrics') paginatorMetrics: MatPaginator | undefined;
  @ViewChild('paginatorArtifacts') paginatorArtifacts: MatPaginator | undefined;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private router: Router,
    private modelValidationService: ModelValidationService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((data) => {
      //TODO: rm params after standartizide
      const params = { ...data };
      if (params['name']) {
        this.name = params['name'];
        this.defaultSearchQuery = this.name;

        params['model_name'] = this.name;
      }
      if (params['id']) {
        this.id = params['id'];
        this.defaultSearchQuery = this.id;
        params['model_id'] = this.id;
      }
      if (params['key']) {
        this.defaultSearchOptionKey = params['key'];
      }
      if (params['metrics_limit']) {
        this.pagigation.metrics.limit = params['metrics_limit'];
      }
      if (params['metrics_page']) {
        this.pagigation.metrics.page = params['metrics_page'];
      }
      if (params['artifacts_limit']) {
        this.pagigation.artifacts.limit = params['artifacts_limit'];
      }
      if (params['artifacts_page']) {
        this.pagigation.artifacts.page = params['artifacts_page'];
      }

      this.getModelValidationArtifacts({
        ...params,
        ...{
          page: params['artifacts_page'] ?? this.pagigation.artifacts.page,
          limit: params['artifacts_limit'] ?? this.pagigation.artifacts.limit,
        },
      });
      this.getModeValidationMetrics({
        ...params,
        ...{
          page: params['metrics_page'] ?? this.pagigation.metrics.page,
          limit: params['metrics_limit'] ?? this.pagigation.metrics.limit,
        },
      });
    });
  }

  ngAfterViewInit() {
    if (this.paginatorMetrics) {
      this.dataSource.metrics.paginator = this.paginatorMetrics;
    }
    if (this.paginatorArtifacts) {
      this.dataSource.artifacts.paginator = this.paginatorArtifacts;
    }
  }

  open(item: ValidationArtifactsData): void {
    this.dataSource.artifacts?.data.forEach((res) => {
      const value = res as ValidationArtifactsData;
      if (res && item.id === value.id) {
        this.modelValidationService.modelValidationArtifactsData = value;
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
    const idxMetrics = (this.paginatorMetrics?.pageIndex as number) ?? 0;
    const idxArtifacts = (this.paginatorArtifacts?.pageIndex as number) ?? 0;
    this.pagigation.metrics.page = idxMetrics + 1;
    this.pagigation.metrics.limit =
      params?.pageSize ?? this.pagigation.metrics.limit;

    this.pagigation.artifacts.page = idxArtifacts + 1;
    this.pagigation.artifacts.limit =
      params?.pageSize ?? this.pagigation.artifacts.limit;

    params['metrics_limit'] =
      this.paginatorMetrics?.pageSize ?? this.pagigation.metrics.limit;
    params['metrics_page'] = this.pagigation.metrics.page;

    params['artifacts_limit'] =
      this.paginatorArtifacts?.pageSize ?? this.pagigation.artifacts.limit;
    params['artifacts_page'] = this.pagigation.artifacts.page;
    params.key = event.key;

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
      next: (v) => {
        this.dataSource.artifacts.data = v.data;
        this.pagigation.artifacts.total = v.pagination.total_items;
      },
      error: (e) => {
        console.error(e);
        if (e.status === RESPONSE_CODE.NOT_FOUND) {
          this.dataSource.artifacts.data = [];
          this.pagigation.artifacts.total = 0;
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
        this.dataSource.metrics.data = v.data;
        this.pagigation.metrics.total = v.pagination.total_items;
      },
      error: (e) => {
        console.error(e);
        if (e.status === RESPONSE_CODE.NOT_FOUND) {
          this.dataSource.metrics.data = [];
          this.pagigation.metrics.total = 0;
        }
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
