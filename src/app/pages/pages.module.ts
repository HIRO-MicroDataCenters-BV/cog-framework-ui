import 'hammerjs';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MaterialRoutes } from './pages.routing';
import { ModelValidationArtifactsComponent } from './model-validation-artifacts/model-validation-artifacts.component';
import { PipelineComponent } from './pipeline/pipeline.component';
import { ModelTrainingComponent } from './model-training/model-training.component';
import { ModelDeploymentComponent } from './model-deployment/model-deployment.component';
import { ModelServingComponent } from './model-serving/model-serving.component';
import { ModelDeleteConfirmationComponent } from './model/model-delete-confirmation/model-delete-confirmation.component';
import { SharedModule } from '../shared/shared.module';
import { PipelineGraphComponent } from './pipeline/pipeline-graph/pipeline-graph.component';
import { AppPipelineRunComponent } from './pipeline/pipeline-run/pipeline-run.component';
import { PipelineDetailComponent } from './pipeline/pipeline-detail/pipeline-detail.component';
import { PipelineRunOutputComponent } from './pipeline/pipeline-run-output/pipeline-run-output.component';
import { AppGraphComponent } from '../components/graph/graph.component';
import { DatasetDeleteConfirmationComponent } from './dataset/dataset-delete-confirmation/dataset-delete-confirmation.component';
import { AppDialogComponent } from '../components/app-dialog/app-dialog.component';
import { AppTableComponent } from '../components/app-table/app-table.component';
import { ModelFilesComponent } from './model-detail/model-files/model-files.component';
import { ModelInfoComponent } from './model-detail/model-info/model-info.component';
import { MatTooltip } from '@angular/material/tooltip';
import { ModelUploadComponent } from '../components/model-upload/model-upload.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(MaterialRoutes),
    SharedModule,
    AppPipelineRunComponent,
    AppGraphComponent,
    AppDialogComponent,
    AppTableComponent,
    MatTooltip,
    ModelUploadComponent,
  ],
  providers: [],
  declarations: [
    ModelValidationArtifactsComponent,
    PipelineComponent,
    ModelTrainingComponent,
    ModelDeploymentComponent,
    ModelServingComponent,
    ModelDeleteConfirmationComponent,
    DatasetDeleteConfirmationComponent,
    PipelineGraphComponent,
    PipelineDetailComponent,
    PipelineRunOutputComponent,
    ModelInfoComponent,
    ModelFilesComponent,
  ],
})
export class MaterialComponentsModule {}
