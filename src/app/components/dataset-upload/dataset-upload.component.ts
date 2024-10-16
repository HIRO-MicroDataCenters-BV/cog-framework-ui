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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  DatesetType,
  DatesetTypeEnum,
  DatesetTypeWithLabels,
} from '../../model/DatasetInfo';
import { finalize } from 'rxjs/operators';
import { MatOption, MatSelect } from '@angular/material/select';

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
    MatSnackBarModule,
    MatSelect,
    KeyValuePipe,
    MatOption,
    NgForOf,
  ],
  templateUrl: './dataset-upload.component.html',
  styleUrl: './dataset-upload.component.scss',
})
export class UploadDatasetComponent {
  files: File[] | null = null;
  datasetName: string = '';
  datasetDescription: string = '';
  datasetType: DatesetType = DatesetTypeEnum.TRAIN_DATA_SET_TYPE;
  protected readonly DatesetTypeWithLabels = DatesetTypeWithLabels;

  loading = false;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private _snackBar: MatSnackBar,
  ) {}

  handleFileInput(files: File[]) {
    if (files) {
      this.files = files;
      return;
    }
    this.files = null;
    this.datasetName = '';
    this.datasetDescription = '';
    this.datasetType = DatesetTypeEnum.TRAIN_DATA_SET_TYPE;
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      politeness: 'assertive',
    });
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
        // TODO: Since we dont have any user service, user id is hardcoded, remove when API without user id is available
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
          this.openSnackBar('Upload failed', 'Close');
        },
        complete: () => {
          this.openSnackBar('Upload success!', 'Close');
        },
      });
  }
}
