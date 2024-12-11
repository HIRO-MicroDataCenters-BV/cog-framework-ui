import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  DatasetData,
  DatasetType,
  DatasetTypeEnum,
  DatasetTypeWithLabels,
} from '../../model/DatasetInfo';
import { finalize } from 'rxjs/operators';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { SnackBarService } from '../../service/snackbar.service';
import { ModelDatasetInfo } from '../../model/ModelDetails';

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
  @Input() modelId: string | number = '';
  name = this.modelId ? 'dataset' : 'and link dataset';
  files: File[] | null = null;
  datasetName: string = '';
  datasetDescription: string = '';
  datasetType: DatasetType = DatasetTypeEnum.TRAIN_DATA_SET_TYPE;
  protected readonly DatasetTypeWithLabels = DatasetTypeWithLabels;
  @Output() updated = new EventEmitter<ModelDatasetInfo>();

  loading = false;

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private snackBarService: SnackBarService,
    private translocoService: TranslocoService,
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

  linkDatasetToModel(dataset: DatasetData): void {
    this.cogFrameworkApiService
      .linkDatasetToModel({
        model_id: `${this.modelId}`,
        dataset_id: dataset.id,
      })
      .subscribe({
        next: () => {
          console.log(dataset);
          this.updated.emit({
            id: `${dataset.id}`,
            data_source_type: this.datasetType,
            description: this.datasetDescription,
            train_and_inference_type: 0, // ?? I'm not sure what to put here it's not documented
            dataset_name: this.datasetName,
          });
        },
        error: () => {
          this.snackBarService.openSnackBar(
            this.translocoService.translate(
              'message.dataset_uploaded_but_no_link',
            ),
          );
        },
        complete: () => {
          this.snackBarService.openSnackBar(
            this.translocoService.translate(
              'message.dataset_uploaded_and_linked',
            ),
          );
        },
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
          if (this.modelId && response.data?.id) {
            this.linkDatasetToModel(response.data);
          }
        },
        error: (error) => {
          console.error(error);
          this.snackBarService.openSnackBar(
            this.translocoService.translate('message.upload_failed'),
          );
        },
        complete: () => {
          if (this.modelId) {
            return;
          }
          this.snackBarService.openSnackBar(
            this.translocoService.translate('message.upload_success'),
          );
        },
      });
  }
}
