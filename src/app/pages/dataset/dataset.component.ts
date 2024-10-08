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
  DataSetData,
  GetDatasetParams,
} from '../../model/DatasetInfo';
import { Router } from '@angular/router';

import { UploadDatasetComponent } from '../../components/dataset-upload/dataset-upload.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DatasetDeleteConfirmationComponent } from './dataset-delete-confirmation/dataset-delete-confirmation.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

const ELEMENT_DATA: DataSetData[] = [];

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
  ],
  templateUrl: './dataset.component.html',
  styleUrl: './dataset.component.scss',
})
export class DatasetComponent implements OnInit, AfterViewInit {
  loading = false;
  displayedColumns: string[] = [
    'id',
    'name',
    'creationTime',
    'author',
    'action',
  ];

  dataSource = new MatTableDataSource<DataSetData>(ELEMENT_DATA);
  datasetName = '';
  datasetId = '';

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.getDatasets();
    return;
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  open(item: DataSetData): void {
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
    const response = this.cogFrameworkApiService.deleteDataSetDetailById(id);
    response.subscribe({
      next: () => {
        this.openSnackBar('DataSet deleted', 'Close');
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

  getDatasets(params: GetDatasetParams = ''): void {
    this.loading = true;
    console.log('a', params);
    const response = this.cogFrameworkApiService.getDataset(params);
    response.subscribe({
      next: (v) => {
        this.dataSource.data = v.data;
      },
      error: (e) => {
        this.openSnackBar(e.error.message, 'Close');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  // TODO: Remove after API update, like in models
  searchByID(): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getDatasetById(this.datasetId);

    response.subscribe({
      next: (v) => {
        const model = [];
        model.push(v.data);
        this.dataSource.data = model;
      },
      error: (e) => {
        this.openSnackBar(e.error.message, 'Close');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  search(): void {
    if (this.datasetId.length > 0) {
      this.searchByID();
    } else {
      this.getDatasets(this.datasetName);
    }
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
