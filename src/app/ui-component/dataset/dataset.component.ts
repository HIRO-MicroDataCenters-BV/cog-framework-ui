import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { environment } from '../../../environments/environment.development';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { DatePipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Dataset, DataSetData } from '../../model/DatasetInfo';
import { Router } from '@angular/router';

import { UploadDatasetComponent } from '../dataset-upload/dataset-upload.component';
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
export class DatasetComponent implements AfterViewInit {
  loading = false;
  displayedColumns: string[] = [
    'id',
    'name',
    'creationTime',
    'author',
    'action',
  ];
  //dataSource = ELEMENT_DATA;
  dataSource = new MatTableDataSource<DataSetData>(ELEMENT_DATA);
  appURL = environment.appURL;
  datasetName = '';
  datasetId = '';

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

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
    console.log('openModelDialog');
    console.log(dataset);
    const dialogRef = this.dialog.open(DatasetDeleteConfirmationComponent, {
      width: '25vw',
      //height: '20vh',
      data: dataset,
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('after close');
      if (result) {
        console.log(result);
        console.log(result.data);
        this.deleteDataSetById(result.data.id);
      }
    });
  }

  deleteDataSetById(id: number): void {
    const response = this.cogFrameworkApiService.deleteDataSetDetailById(id);
    response.subscribe({
      next: (v) => {
        console.log(v);
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

  search(): void {
    if (this.datasetId.length > 0) {
      console.log('Search by ID');
      this.searchByID();
    } else {
      console.log('Search by Name');
      this.searchByName();
    }
  }

  searchByID(): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getDatasetById(this.datasetId);

    response.subscribe({
      next: (v) => {
        console.log(v);
        const model = [];
        model.push(v.data);
        this.dataSource.data = model;
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

  searchByName(): void {
    this.loading = true;
    console.log('search dataset with name ' + this.datasetName);
    const response = this.cogFrameworkApiService.getDataSetDetailByName(
      this.datasetName,
    );
    response.subscribe({
      next: (v) => {
        console.log(v);
        this.dataSource.data = v.data;
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

  private openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  private deleteDataSetFromTable(id: number): void {
    const remaining = [];
    for (const i in this.dataSource.data) {
      if (id !== this.dataSource.data[i].id) {
        remaining.push(this.dataSource.data[i]);
      }
    }
    this.dataSource.data = remaining;
  }
}
