import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { KeyValuePipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileInputComponent } from '../file-input/file-input.component';
import { MatButtonModule } from '@angular/material/button';
import {
  DatasetType,
  DatasetTypeEnum,
  DatasetTypeWithLabels,
} from '../../model/DatasetInfo';
import { finalize } from 'rxjs/operators';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoModule } from '@jsverse/transloco';
import { SnackBarService } from '../../service/snackbar.service';

@Component({
  selector: 'app-upload-dataset',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    NgIf,
    FileInputComponent,
    MatButtonModule,
    MatSelect,
    KeyValuePipe,
    MatOption,
    NgForOf,
    TranslocoModule,
  ],
  templateUrl: './dataset-upload.component.html',
  styleUrl: './dataset-upload.component.scss',
})
export class UploadDatasetComponent {
  name: string = 'dataset';
  files: File[] | null = null;
  datasetName: string = '';
  datasetDescription: string = '';
  datasetType: DatasetType = DatasetTypeEnum.TRAIN_DATA_SET_TYPE;
  protected readonly DatasetTypeWithLabels = DatasetTypeWithLabels;

  loading = false;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private snackBarService: SnackBarService,
  ) {}

  handleFileInput(files: File[]) {
    if (files) {
      this.files = files;
      return;
    }
    this.files = null;
    this.datasetName = '';
    this.datasetDescription = '';
    this.datasetType = DatasetTypeEnum.TRAIN_DATA_SET_TYPE;
  }

  uploadFile(): void {
    if (
      !this.files ||
      !this.datasetName ||
      !this.datasetDescription ||
      !this.datasetType
    ) {
      return;
    }
    this.loading = true;

    this.cogFrameworkApiService
      .uploadDataset({
        files: this.files,
        name: this.datasetName,
        type: this.datasetType,
        description: this.datasetDescription,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          console.log(response);
        },
        error: (error) => {
          console.log(error);
          this.snackBarService.openSnackBar('Upload failed');
        },
        complete: () => {
          this.snackBarService.openSnackBar('Upload success!');
        },
      });
  }
}
