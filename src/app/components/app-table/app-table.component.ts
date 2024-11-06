import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  AsyncPipe,
  DecimalPipe,
  NgForOf,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { PAGE_SIZE_OPTIONS } from 'src/app/constants';
import { GetParams, TableResponse } from 'src/app/model/General';
import { Observable } from 'rxjs/internal/Observable';
import { CogFrameworkApiService } from 'src/app/service/cog-framework-api.service';
import {
  ValidationArtifactsChart,
  ValidationArtifactsData,
} from 'src/app/model/ValidationArtifacts';
import { MatCardModule } from '@angular/material/card';
import { buildImgURL } from 'src/app/utils';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    TranslocoPipe,
    AsyncPipe,
    NgForOf,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    MatCardModule,
    DecimalPipe,
  ],
  templateUrl: './app-table.component.html',
  styleUrl: './app-table.component.scss',
})
export class AppTableComponent implements AfterViewInit {
  loading = false;
  pageSizeOptions = PAGE_SIZE_OPTIONS;
  //@Input() source!: (params: GetParams) => Observable<unknown>;
  @Input() source!: string;
  @Input() query: string | unknown = '';
  @Input() params: GetParams = {};
  @Input() displayedColumns: string[] = [];
  @Input() selected: unknown = null;
  @Input() isMultipleSelect: boolean = false;
  @Output() changeSelect = new EventEmitter<void>();

  dataSource: MatTableDataSource<unknown> = new MatTableDataSource();

  artifactsDataSource: MatTableDataSource<unknown> = new MatTableDataSource();

  artifactsDisplayedColumns: string[] = [
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

  pagigation = {
    limit: this.pageSizeOptions[0],
    page: 1,
    total: 0,
  };

  csvData: string | undefined;

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(private cogFrameworkApiService: CogFrameworkApiService) {}

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.search();
    }
  }

  getColumns(columns: string[]): string[] {
    return columns.filter((col) => !col.startsWith('__'));
  }

  getArtifactsCharts(
    artifacts: ValidationArtifactsData,
  ): ValidationArtifactsChart[] {
    const list: ValidationArtifactsChart[] = [];
    for (const name of Object.keys(artifacts)) {
      const value = artifacts[name as keyof ValidationArtifactsData] as string;
      if (name != 'per_class_metrics') {
        list.push({
          name,
          value,
        });
      }
    }
    console.log('list', list);

    this.modeValidationCsv(
      artifacts[
        'per_class_metrics' as keyof ValidationArtifactsData
      ].toString(),
    );

    return list;
  }

  modeValidationCsv(csvFileS3Url: string): void {
    console.log('csvFileS3Url', csvFileS3Url);
    /*
    const response =
      this.cogFrameworkApiService.getModelValidationCSV(csvFileS3Url);
    console.log('csv', csvFileS3Url);
    response.subscribe({
      next: (data) => {
      
        this.csvData = data;
        const list = data.split('\n');
        const result: unknown[] = [];
        list.forEach((e: string) => {
          const csvData = e.split(',');
          if (csvData[1] != undefined && csvData[0] != 'positive_class') {
            const row = csvData.map((row: string) => parseFloat(row));
            const d = {
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

            //console.log('d', d);
            ///this.modelValidationMetricTableSource.push(d);
            result.push(d);
          }
        });
        this.artifactsDataSource.data = result;
        
        ///console.log('list', list);
        //console.log(this.modelValidationMetricTableSource);
      },
      error: () => {
        //console.error(e);
      },
    });
    */
  }

  buildImgURL(url: string): string {
    console.log('b');
    return buildImgURL(url);
  }

  search() {
    const response = (
      this.cogFrameworkApiService[
        this.source as keyof CogFrameworkApiService
      ] as (params: GetParams) => Observable<TableResponse>
    )(this.params);
    response.subscribe({
      next: (v) => {
        if (v.data) {
          this.dataSource.data = v.data;
          this.pagigation.total = v.pagination.total_items;
        }
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        console.info('complete');
      },
    });
  }
}
