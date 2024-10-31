import { Component, Input } from '@angular/core';
import { ModelDetailData, ModelFileInfo } from '../../../model/ModelDetails';
import { ModelFileData } from '../../../model/ModelFile';

@Component({
  selector: 'app-model-files',
  templateUrl: './model-files.component.html',
  styleUrls: ['./model-files.component.scss'],
})
export class ModelFilesComponent {
  @Input()
  get modelDetailData(): ModelDetailData {
    return this._modelDetailData;
  }

  set modelDetailData(data: ModelDetailData) {
    this._modelDetailData = data;
    this.modelFileDataSource = this._modelDetailData.model_files;
  }

  _modelDetailData!: ModelDetailData;
  modelFileDataSource: ModelFileInfo[] = [];
  displayedColumns: string[] = ['id', 'name', 'action'];
  constructor() {
    // this.modelFileDataSource = this.modelDetailData.model_files;
  }

  updateModelFile(modelFile: ModelFileData): void {
    this.modelFileDataSource = [
      ...this.modelFileDataSource,
      {
        file_id: `${modelFile.id}`,
        file_name: modelFile.file_name,
      },
    ];
  }
}
