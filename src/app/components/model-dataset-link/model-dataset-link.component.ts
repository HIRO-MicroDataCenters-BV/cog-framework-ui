import { Component } from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  AppSearcherComponent,
  SearcherEvent,
  SearcherOption,
} from '../app-searcher/app-searcher.component';
import { DEF_SEARCH_PARAMS, RESPONSE_CODE } from '../../constants';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatasetData, GetDatasetParams } from '../../model/DatasetInfo';
import { MatTableDataSource } from '@angular/material/table';

interface Error {
  detail?: string;
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
  ],
  templateUrl: './model-dataset-link.component.html',
  styleUrl: './model-dataset-link.component.scss',
})
export class ModelDatasetLinkComponent {
  searchOptions: SearcherOption[] = [...DEF_SEARCH_PARAMS];
  defaultSearchOptionKey = '';
  defaultSearchQuery = '';
  loading = false;
  dataSource = new MatTableDataSource<DatasetData>([]);

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
    const msg = error?.message ?? error?.detail ?? error?.error_message;
    if (msg) {
      this.openSnackBar(msg, this.translocoService.translate('action.close'));
    }
  }

  search(event: SearcherEvent): void {
    const params: GetDatasetParams = event.query
      ? { [event.key]: event.query }
      : {};
    this.loading = true;
    const response = this.cogFrameworkApiService.getDataset(params);
    response.subscribe({
      next: (v) => {
        console.log(v);
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
}
