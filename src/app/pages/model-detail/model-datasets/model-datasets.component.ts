import { Component, Input } from '@angular/core';
import { ModelDatasetInfo, ModelDetailData } from '../../../model/ModelDetails';
import { CogFrameworkApiService } from '../../../service/cog-framework-api.service';
import { getDatasetTypeLabel } from '../../../utils';
import { SnackBarService } from '../../../service/snackbar.service';

@Component({
  selector: 'app-model-datasets',
  templateUrl: './model-datasets.component.html',
  styleUrls: ['./model-datasets.component.scss'],
})
export class ModelDatasetsComponent {
  protected readonly getDatasetTypeLabel = getDatasetTypeLabel;

  @Input()
  get modelDetailData(): ModelDetailData {
    return this._modelDetailData;
  }

  set modelDetailData(data: ModelDetailData) {
    this._modelDetailData = data;
    this.dataSource = this._modelDetailData.datasets;
  }

  _modelDetailData!: ModelDetailData;
  dataSource: ModelDatasetInfo[] = [];
  displayedColumns: string[] = [
    'id',
    'name',
    'description',
    'dataSourceType',
    'action',
  ];

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private snackBarService: SnackBarService,
  ) {}

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
        this.snackBarService.openSnackBar(v.message);
      },
      error: (e) => {
        this.snackBarService.openSnackBar(e.error.message);
      },
      complete: () => {
        this.modelDetailData.datasets = this.modelDetailData.datasets.filter(
          (dataset) => dataset.id !== id,
        );
        this.dataSource = this.modelDetailData.datasets;
      },
    });
  }

  updateDatasets(dataset: ModelDatasetInfo): void {
    this.modelDetailData.datasets = [...this.modelDetailData.datasets, dataset];
    this.modelDetailData = { ...this.modelDetailData };
  }
}
