import { Component, Input } from '@angular/core';
import { ModelDetailData, ModelDatasetInfo } from '../../../model/ModelDetails';

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
  constructor() {}

  open(id: string): void {
    console.log(id);
  }
}
