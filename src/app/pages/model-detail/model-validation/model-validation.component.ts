import { Component, Input, OnInit } from '@angular/core';
import { ModelDetailData, ModelDatasetInfo } from '../../../model/ModelDetails';
import { CogFrameworkApiService } from 'src/app/service/cog-framework-api.service';

@Component({
  selector: 'app-model-validation',
  templateUrl: './model-validation.component.html',
  styleUrls: ['./model-validation.component.scss'],
})
export class ModelValidationComponent implements OnInit {
  @Input()
  get modelDetailData(): ModelDetailData {
    return this._modelDetailData;
  }

  set modelDetailData(data: ModelDetailData) {
    this._modelDetailData = data;
    this.modelValidationDataSource = [];
  }

  _modelDetailData!: ModelDetailData;
  modelValidationDataSource: ModelDatasetInfo[] = [];
  displayedColumns = {
    metrics: [
      'id',
      'dataset_id',
      'accuracy_score',
      'example_count',
      'f1_score',
      'log_loss',
      'precision_score',
      'recall_score',
      'roc_auc',
      'score',
    ],
    scores: ['name', 'value'],
    artifacts: ['id', '__validation_artifacts'],
  };

  constructor(private cogFrameworkApiService: CogFrameworkApiService) {}

  ngOnInit(): void {
    this.getArtifacts();

    console.log(
      's',
      this.displayedColumns.artifacts.filter((col) => !col.startsWith('_')),
    );
  }

  getArtifacts(): void {
    const response = this.cogFrameworkApiService.getModelValidationArtifacts({
      model_id: this.modelDetailData.model_id.toString(),
    });

    response.subscribe({
      next: (v) => {
        console.log(v);
      },
      error: (e) => {
        console.error(e);
      },
      complete: () => {
        console.info('complete');
      },
    });
  }
}
