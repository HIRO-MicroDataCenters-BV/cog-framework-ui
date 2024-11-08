import { Component, Input } from '@angular/core';
import { ModelDetailData } from '../../../model/ModelDetails';

@Component({
  selector: 'app-model-info',
  templateUrl: './model-info.component.html',
  styleUrls: ['./model-info.component.scss'],
})
export class ModelInfoComponent {
  @Input()
  get modelDetailData(): ModelDetailData {
    return this._modelDetailData;
  }

  set modelDetailData(data: ModelDetailData) {
    this._modelDetailData = data;
  }

  _modelDetailData!: ModelDetailData;

  constructor() {}
}
