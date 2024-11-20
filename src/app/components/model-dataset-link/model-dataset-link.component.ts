import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import {
  AppSearcherComponent,
  SearcherEvent,
  SearcherOption,
} from '../app-searcher/app-searcher.component';
import { DEF_SEARCH_PARAMS, RESPONSE_CODE } from '../../constants';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DatasetData,
  DatesetType,
  DatesetTypeWithLabels,
  GetDatasetParams,
} from '../../model/DatasetInfo';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';
import { MatProgressBar } from '@angular/material/progress-bar';
import { DatePipe, NgIf } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatPaginator } from '@angular/material/paginator';
import { ModelDatasetInfo } from '../../model/ModelDetails';

interface Error {
  detail: { msg: string };
  message?: string;
  error_message?: string;
}

@Component({
  selector: 'app-model-dataset-link',
  standalone: true,
  imports: [
    MatCard,
    TranslocoPipe,
    MatCardTitle,
    MatCardHeader,
    MatCardContent,
    AppSearcherComponent,
    TranslocoDirective,
    MatProgressBar,
    NgIf,
    DatePipe,
    MatTable,
    MatTooltip,
    MatIcon,
    MatCellDef,
    MatHeaderCell,
    MatCell,
    MatColumnDef,
    MatIconButton,
    MatHeaderCellDef,
    MatPaginator,
    MatHeaderRowDef,
    MatRowDef,
    MatNoDataRow,
    MatRow,
    MatHeaderRow,
  ],
  templateUrl: './model-dataset-link.component.html',
  styleUrl: './model-dataset-link.component.scss',
})
export class ModelDatasetLinkComponent {
  @Input() modelId = 0;
  @Input() modelDatasets: ModelDatasetInfo[] = [];
  searchOptions: SearcherOption[] = [...DEF_SEARCH_PARAMS];
  defaultSearchOptionKey = '';
  defaultSearchQuery = '';
  loading = false;
  dataSource = new MatTableDataSource<DatasetData>([]);
  @Output() updated = new EventEmitter<ModelDatasetInfo>();
  displayedColumns: string[] = [
    'id',
    'dataset_name',
    'description',
    'dataSourceType',
    'creationTime',
    'action',
  ];

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private snackBar: MatSnackBar,
    private translocoService: TranslocoService,
  ) {}

  private openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  getError(error: Error): void {
    const msg = error?.message ?? error?.error_message ?? error.detail?.msg;
    if (msg) {
      this.openSnackBar(msg, this.translocoService.translate('action.close'));
    }
  }

  search(event: SearcherEvent): void {
    if (event.query.length < 1) {
      this.dataSource.data = [];
      return;
    }
    const params: GetDatasetParams = event.query
      ? { [event.key]: event.query }
      : {};
    this.loading = true;
    const response = this.cogFrameworkApiService.getDataset(params);
    response.subscribe({
      next: (v) => {
        const usedDatasetIds = this.modelDatasets.map((d) => String(d.id));
        this.dataSource.data = v.data.filter(
          (d) => !usedDatasetIds.includes(String(d.id)),
        );
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

  linkDataset(id: number): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.linkDatasetToModel({
      model_id: this.modelId,
      dataset_id: id,
    });
    response.subscribe({
      next: (v) => {
        this.openSnackBar(
          v.message,
          this.translocoService.translate('action.close'),
        );
        const dataset = this.dataSource.data.find((d) => d.id === id);
        this.updated.emit({
          id: String(id),
          data_source_type: dataset!.data_source_type,
          description: dataset!.description,
          train_and_inference_type: dataset!.train_and_inference_type,
          dataset_name: dataset!.dataset_name,
        });
        this.dataSource.data = this.dataSource.data.filter((d) => d.id !== id);
      },
      error: (e) => {
        this.getError(e.error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  getDatasetTypeLabel(type: DatesetType): string {
    return DatesetTypeWithLabels[type];
  }
}
