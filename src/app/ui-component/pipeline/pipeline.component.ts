import { Component } from '@angular/core';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { Pipeline } from '../../model/PipeLine';

interface PipeLineTableModel {
  name: string;
  description: string;
  uploadAt: string;
}

@Component({
  selector: 'app-pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.scss'],
})
export class PipelineComponent {
  modelName = '';
  modelId = '1';

  pipeLineTableModelDataSource: PipeLineTableModel[] = [];
  displayedColumnsPipeLineTableModel: string[] = ['name', 'des', 'createdAt'];
  loading = false;

  constructor(private cogFrameworkApiService: CogFrameworkApiService) {}

  search(): void {
    this.getPipeLineByID();
  }

  getPipeLineByID(): void {
    this.loading = true;
    // const pipeline = this.cogFrameworkApiService.getPipelineByModelID(this.modelId);
    const response = this.cogFrameworkApiService.getPipelineByModelID(
      this.modelId,
    );
    response.subscribe({
      next: (v) => {
        console.log(v);
        console.log(v.data[0]);
        this.buildPipeLineTableModelId(v.data[0]);
      },
      error: (e) => {
        console.log('error----->');
        console.error(e);
        console.error(e.status);
        console.error(e.error.error);
      },
      complete: () => {
        //this.loading = false;
        console.info('complete');
        this.loading = false;
      },
    });
  }

  buildPipeLineTableModelId(pipeline: Pipeline): void {
    const dd: PipeLineTableModel = {
      name: pipeline.name,
      description: pipeline.description,
      uploadAt: pipeline.createdAt_in_sec,
    };
    this.pipeLineTableModelDataSource.push(dd);
    console.log(this.pipeLineTableModelDataSource);
  }
}
