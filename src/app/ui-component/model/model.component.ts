import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { Model } from 'src/app/model/ModelInfo';
import { DatePipe, NgIf } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';

import { ModelUploadComponent } from '../model-upload/model-upload.component';
import { MatDialog } from '@angular/material/dialog';
import { ModelDeleteConfirmationComponent } from './model-delete-confirmation/model-delete-confirmation.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { ModelServeComponent } from './model-serve/model-serve.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const ELEMENT_DATA: Model[] = [];

@Component({
  selector: 'app-model',
  standalone: true,
  imports: [
    MatCardModule,
    MatTabsModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    NgIf,
    DatePipe,
    MatProgressBarModule,
    ModelUploadComponent,
    MatPaginatorModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './model.component.html',
  styleUrl: './model.component.scss',
})
export class ModelComponent implements AfterViewInit {
  loading = false;
  displayedColumns: string[] = [
    'id',
    'name',
    'creationTime',
    'author',
    'action',
  ];
  dataSource = new MatTableDataSource<Model>(ELEMENT_DATA);
  modelName = '';
  modelId = '';

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

  open(item: Model): void {
    this.router
      .navigate(['/model-detail'], { queryParams: { id: item.id } })
      .then(() => {
        console.log('redirected to other component');
      });
  }

  search(): void {
    if (this.modelId.length > 0) {
      console.log('Search by ID');
      this.searchByID();
    } else {
      console.log('Search by Name');
      this.searchByName();
    }
  }

  searchByID(): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getModelById(this.modelId);

    response.subscribe({
      next: (v) => {
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
      },
    });
  }

  searchByName(): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getModelByName(this.modelName);
    response.subscribe({
      next: (v) => {
        this.dataSource.data = v.data;
        this.dataSource.data.forEach((f) => {
          f.isDeployed = false;
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

  openModelDialog(model: Model): void {
    const dialogRef = this.dialog.open(ModelDeleteConfirmationComponent, {
      data: model,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteModelById(result.data.id);
      }
    });
  }

  modelServe(model: Model): void {
    const dialogRef = this.dialog.open(ModelServeComponent, {
      data: model,
      minWidth: '25%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        result.model.isDeployed = true;
        const response = this.cogFrameworkApiService.serveModel(
          result.modelServeData,
        );
        response.subscribe({
          next: () => {
            this.openSnackBar('Model deployment starting...', 'Close');
          },
          error: (e) => {
            this.openSnackBar(e.error.errors[0].error_message, 'Close');
            result.model.isDeployed = false;
          },
          complete: () => {
            result.model.isDeployed = false;
          },
        });
      }
    });
  }

  deleteModelById(id: number): void {
    const response = this.cogFrameworkApiService.deleteModelById(id);
    response.subscribe({
      next: () => {
        this.openSnackBar('Model deleted', 'Close');
        this.deleteModelFromTable(id);
      },
      error: (e) => {
        console.error(e);
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

  private deleteModelFromTable(id: number): void {
    this.dataSource.data = this.dataSource.data.filter(
      (item) => item.id !== id,
    );
  }
}
