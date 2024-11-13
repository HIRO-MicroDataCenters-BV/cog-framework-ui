import { Component, Input } from '@angular/core';
import { ModelDatasetInfo, ModelDetailData } from '../../../model/ModelDetails';
import { CogFrameworkApiService } from '../../../service/cog-framework-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-model-datasets',
  templateUrl: './model-datasets.component.html',
  styleUrls: ['./model-datasets.component.scss'],
})
export class ModelDatasetsComponent {
  @Input()
  get modelDetailData(): ModelDetailData {
    return this._modelDetailData;
  }

  set modelDetailData(data: ModelDetailData) {
    this._modelDetailData = data;
    this.modelDatasetDataSource = this._modelDetailData.datasets;
  }

  _modelDetailData!: ModelDetailData;
  modelDatasetDataSource: ModelDatasetInfo[] = [];
  displayedColumns: string[] = ['dataset_id', 'dataset_name', 'action'];

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

  open(id: string): void {
    console.log(id);
  }

  unlinkDatasetFromModel(id: string): void {
    const response = this.cogFrameworkApiService.unlinkDatasetFromModel({
      model_id: this.modelDetailData.model_id,
      dataset_id: id,
    });
    response.subscribe({
      next: (v) => {
        this.openSnackBar(
          v.message,
          this.translocoService.translate('action.close'),
        );
      },
      error: (e) => {
        this.openSnackBar(
          e.error.message,
          this.translocoService.translate('action.close'),
        );
      },
      complete: () => {
        this.modelDetailData.datasets = this.modelDetailData.datasets.filter(
          (dataset) => dataset.dataset_id !== id,
        );
        this.modelDatasetDataSource = this.modelDetailData.datasets;
      },
    });
  }
}
