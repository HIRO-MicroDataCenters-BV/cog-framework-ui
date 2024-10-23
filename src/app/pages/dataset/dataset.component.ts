import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { DatePipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Dataset,
  DatasetData,
  GetDatasetParams,
} from '../../model/DatasetInfo';
import { ActivatedRoute, Router } from '@angular/router';

import { UploadDatasetComponent } from '../../components/dataset-upload/dataset-upload.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DatasetDeleteConfirmationComponent } from './dataset-delete-confirmation/dataset-delete-confirmation.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PAGE_SIZE_OPTIONS, RESPONSE_CODE } from 'src/app/constants';
import {
  AppSearcherComponent,
  SearcherEvent,
  SearcherOption,
} from '../../components/app-searcher/app-searcher.component';

interface Error {
  detail?: string;
  message?: string;
  error_message?: string;
}

@Component({
  selector: 'app-dataset',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    DatePipe,
    FormsModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    NgIf,
    UploadDatasetComponent,
    MatPaginatorModule,
    TranslocoModule,
    AppSearcherComponent,
  ],
  templateUrl: './dataset.component.html',
  styleUrl: './dataset.component.scss',
})
export class DatasetComponent implements OnInit, AfterViewInit {
  name = 'dataset';
  loading = false;
  displayedColumns: string[] = [
    'id',
    'name',
    'creationTime',
    'author',
    'action',
  ];
  pageSizeOptions = PAGE_SIZE_OPTIONS;
  dataSource = new MatTableDataSource<DatasetData>([]);
  datasetName = '';
  datasetId = '';
  limit = this.pageSizeOptions[0];
  page = 1;
  total = 0;
  searchOptions: SearcherOption[] = [
    { key: 'name', label: 'Dataset Name', inputType: 'text' },
    { key: 'id', label: 'Dataset Id', inputType: 'number' },
  ];
  defaultSearchOptionKey = '';
  defaultSearchQuery = '';
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['name']) {
        this.datasetName = params['name'];
        this.defaultSearchQuery = this.datasetName;
      }
      if (params['id']) {
        this.datasetId = params['id'];
        this.defaultSearchQuery = this.datasetId;
      }
      if (params['key']) {
        this.defaultSearchOptionKey = params['key'];
      }
      if (params['limit']) {
        this.limit = params['limit'];
      }
      if (params['page']) {
        this.page = params['page'];
      }
      this.getDatasets({ ...params });
    });
    this.defaultSearchOptionKey = this.datasetName ? 'name' : 'id';
    this.defaultSearchQuery = this.datasetName || this.datasetId;
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  getError(error: Error): void {
    const msg = error?.message ?? error?.detail ?? error?.error_message;
    if (msg) {
      this.openSnackBar(msg, this.translocoService.translate('action.close'));
    }
  }

  open(item: DatasetData): void {
    this.router
      .navigate(['/dataset-detail'], { queryParams: { id: item.id } })
      .then((r) => {
        console.log('redirected to other component', r);
      });
  }

  openModelDialog(dataset: Dataset): void {
    const dialogRef = this.dialog.open(DatasetDeleteConfirmationComponent, {
      width: '25vw',
      data: dataset,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteDataSetById(result.data.id);
      }
    });
  }

  deleteDataSetById(id: number): void {
    const response = this.cogFrameworkApiService.deleteDatasetById(id);
    response.subscribe({
      next: () => {
        this.openSnackBar(
          this.translocoService.translate('message._deleted', {
            name: this.name,
          }),
          this.translocoService.translate('action.close'),
        );
        this.deleteDataSetFromTable(id);
      },
      error: (e) => {
        console.error(e);
      },
      complete: () => {
        console.info('complete');
      },
    });
  }

  getDatasets(params: GetDatasetParams = {}): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getDataset(params);
    response.subscribe({
      next: (v) => {
        this.dataSource.data = v.data;
      },
      error: (e) => {
        if (e.status === RESPONSE_CODE.NOT_FOUND) {
          this.dataSource.data = [];
        }
        this.getError(e.error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  search(event: SearcherEvent = { key: 'name', query: '' }): void {
    const params: GetDatasetParams = event.query
      ? { [event.key]: event.query }
      : {};
    const i = (this.paginator?.pageIndex as number) ?? 0;
    this.page = i + 1;
    this.limit = params?.pageSize ?? this.limit;
    params.limit = this.paginator?.pageSize ?? this.limit;
    params.page = this.page;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'replace',
    });
  }

  private deleteDataSetFromTable(id: number): void {
    this.dataSource.data = this.dataSource.data.filter(
      (item) => item.id !== id,
    );
  }

  private openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
