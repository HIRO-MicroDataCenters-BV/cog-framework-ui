import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
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
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
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
export class ModelUploadComponent implements OnInit, OnDestroy {
  @Output() modelUploadedEvent = new EventEmitter<ModelFileData>();
  destroy$ = new Subject<void>();
  file: File | null = null;
  modelId: string = '';
  modelDescription: string = '';
  modelType: ModelFileType = ModelFileTypeEnum.MODEL_POLICY_FILE;
  loading = false;
  protected readonly ModelFileTypeWithLabels = ModelFileTypeWithLabels;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private _snackBar: MatSnackBar,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.modelId = params['id'];
      });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      politeness: 'assertive',
    });
  }

  handleFileInput(file: File) {
    if (file) {
      this.file = file;
      return;
    }
    this.file = null;
    this.modelId = '';
    this.modelDescription = '';
    this.modelType = ModelFileTypeEnum.MODEL_POLICY_FILE;
  }

  uploadFile(): void {
    if (
      !this.file ||
      !this.modelId ||
      !this.modelDescription ||
      !this.modelType
    ) {
      return;
    }

    this.loading = true;
    this.cogFrameworkApiService
      .uploadModel({
        file: this.file,
        // TODO: Since we dont have any user service, user id is hardcoded, remove when API without user id is available
        user_id: '0',
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
