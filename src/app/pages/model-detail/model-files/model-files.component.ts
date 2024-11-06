import { Component, Input } from '@angular/core';
import { ModelDetailData, ModelFileInfo } from '../../../model/ModelDetails';
import { ModelFileData } from '../../../model/ModelFile';
import { CogFrameworkApiService } from 'src/app/service/cog-framework-api.service';

@Component({
  selector: 'app-model-files',
  templateUrl: './model-files.component.html',
  styleUrls: ['./model-files.component.scss'],
})
export class ModelFilesComponent {
  loading: boolean = false;
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
  constructor(private cogFrameworkApiService: CogFrameworkApiService) {
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

  open(id: string): void {
    console.log(id);
  }

  download(model_id: string): void {
    console.log(model_id);
    const response = this.cogFrameworkApiService.downloadModelFile({
      model_id,
    });
    response.subscribe({
      next: (v) => {
        console.log('download', v);
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        console.info('complete');
      },
    });
  }
}
