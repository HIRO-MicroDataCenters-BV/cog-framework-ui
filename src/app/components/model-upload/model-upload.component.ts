import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
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
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  ModelFileData,
  ModelFileType,
  ModelFileTypeEnum,
  ModelFileTypeWithLabels,
} from '../../model/ModelFile';
import { MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-upload-model',
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
    NgForOf,
    MatOption,
    KeyValuePipe,
  ],
  templateUrl: './model-upload.component.html',
  styleUrl: './model-upload.component.scss',
})
export class ModelUploadComponent implements OnDestroy {
  @Input() modelId: string = '';
  @Output() modelUploadedEvent = new EventEmitter<ModelFileData>();
  destroy$ = new Subject<void>();
  files: File[] | null = null;
  modelDescription: string = '';
  modelType: ModelFileType = ModelFileTypeEnum.MODEL_POLICY_FILE;
  loading = false;
  protected readonly ModelFileTypeWithLabels = ModelFileTypeWithLabels;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private _snackBar: MatSnackBar,
  ) {}

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      politeness: 'assertive',
    });
  }

  handleFileInput(files: File[]) {
    if (files) {
      this.files = files;
      return;
    }
    this.files = null;
    this.modelDescription = '';
    this.modelType = ModelFileTypeEnum.MODEL_POLICY_FILE;
  }

  uploadFile(): void {
    if (
      !this.files ||
      !this.modelId ||
      !this.modelDescription ||
      !this.modelType
    ) {
      return;
    }

    this.loading = true;

    this.cogFrameworkApiService
      .uploadModel({
        files: this.files,
        model_id: this.modelId,
        model_file_type: this.modelType,
        model_file_description: this.modelDescription,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.modelUploadedEvent.emit(response.data);
          }
        },
        error: (e) => {
          this.openSnackBar(e?.error.message ?? 'Upload failed!', 'Close');
        },
        complete: () => {
          this.openSnackBar('Upload success!', 'Close');
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
