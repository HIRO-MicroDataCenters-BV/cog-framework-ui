import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { GetModelParams, Model } from 'src/app/model/ModelInfo';
import { DatePipe, NgIf } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ModelDeleteConfirmationComponent } from './model-delete-confirmation/model-delete-confirmation.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { ModelServeComponent } from './model-serve/model-serve.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslocoRootModule } from 'src/app/transloco-root.module';

const MODEL_DATA: Model[] = [];

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
    MatPaginatorModule,
    MatSelectModule,
    MatProgressSpinner,
    TranslocoRootModule,
  ],
  templateUrl: './model.component.html',
  styleUrl: './model.component.scss',
})
export class ModelComponent implements OnInit, AfterViewInit {
  loading = false;
  displayedColumns: string[] = [
    'id',
    'name',
    'creationTime',
    'author',
    'action',
  ];
  dataSource = new MatTableDataSource<Model>(MODEL_DATA);
  modelName = '';
  modelId = '';

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.getModels();
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  open(item: Model): void {
    this.router
      .navigate(['/model-detail'], { queryParams: { id: item.id } })
      .then((r) => {
        console.log(r);
        console.log('redirected to other component');
      });
  }

  getModels(params: GetModelParams = {}): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getModel(params);
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

  search(): void {
    if (this.modelId.length > 0) {
      this.getModels({ id: this.modelId });
    } else {
      this.getModels({ name: this.modelName });
    }
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
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  private deleteModelFromTable(id: number): void {
    this.dataSource.data = this.dataSource.data.filter(
      (item) => item.id !== id,
    );
  }
}
