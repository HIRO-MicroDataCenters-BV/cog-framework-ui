import { Routes } from '@angular/router';

import { ModelComponent } from './model/model.component';
import { DatasetComponent } from './dataset/dataset.component';
import { ModelDetailComponent } from './model-detail/model-detail.component';
import { DatasetDetailComponent } from './dataset-detail/dataset-detail.component';
import { ModelValidationSearchComponent } from './model-validation-search/model-validation-search.component';
import { ModelValidationArtifactsComponent } from './model-validation-artifacts/model-validation-artifacts.component';
import { PipelineComponent } from './pipeline/pipeline.component';
import { ModelTrainingComponent } from './model-training/model-training.component';
import { ModelDeploymentComponent } from './model-deployment/model-deployment.component';
import { ModelServingComponent } from './model-serving/model-serving.component';
import { PipelineGraphComponent } from './pipeline/pipeline-graph/pipeline-graph.component';
import { PipelineDetailComponent } from './pipeline/pipeline-detail/pipeline-detail.component';
import { PipelineRunOutputComponent } from './pipeline/pipeline-run-output/pipeline-run-output.component';

export const MaterialRoutes: Routes = [
  {
    path: 'model',
    component: ModelComponent,
  },
  {
    path: 'model-detail',
    component: ModelDetailComponent,
  },
  {
    path: 'dataset',
    component: DatasetComponent,
  },
  {
    path: 'dataset-detail',
    component: DatasetDetailComponent,
  },
  {
    path: 'model-validation',
    component: ModelValidationSearchComponent,
  },
  {
    path: 'model-training',
    component: ModelTrainingComponent,
  },
  {
    path: 'model-deployment',
    component: ModelDeploymentComponent,
  },
  {
    path: 'model-serving',
    component: ModelServingComponent,
  },
  {
    path: 'model-validation-artifacts',
    component: ModelValidationArtifactsComponent,
  },
  {
    path: 'runs',
    component: PipelineComponent,
  },
  {
    path: 'runs/:id',
    component: PipelineDetailComponent,
    children: [
      {
        path: '',
        redirectTo: 'run-output',
        pathMatch: 'full',
      },
      {
        path: 'graph',
        component: PipelineGraphComponent,
      },

      {
        path: 'run-output',
        component: PipelineRunOutputComponent,
      },
      {
        path: 'config',
        component: PipelineGraphComponent,
      },
    ],
  },
];
