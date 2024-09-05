import 'hammerjs';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { DemoMaterialModule } from '../demo-material-module';
import { CdkTableModule } from '@angular/cdk/table';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialRoutes } from './component.routing';
import { ModelValidationSearchComponent } from './model-validation-search/model-validation-search.component';
import { ModelValidationArtifactsComponent } from './model-validation-artifacts/model-validation-artifacts.component';
import { PipelineComponent } from './pipeline/pipeline.component';
import { ModelTrainingComponent } from './model-training/model-training.component';
import { ModelDeploymentComponent } from './model-deployment/model-deployment.component';
import { ModelServingComponent } from './model-serving/model-serving.component';
import { ModelDeleteConfirmationComponent } from './model/model-delete-confirmation/model-delete-confirmation.component';
import { SharedModule } from '../shared/shared.module';
import { LottieComponent } from 'ngx-lottie';
import { AppLottieComponent } from './lottie/lottie.component';
import { PipelineGraphComponent } from './pipeline/pipeline-graph/pipeline-graph.component';
import { AppPipelineRunComponent } from './pipeline/pipeline-run/pipeline-run.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(MaterialRoutes),
    DemoMaterialModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CdkTableModule,
    SharedModule,
    LottieComponent,
    AppLottieComponent,
    AppPipelineRunComponent,
  ],
  providers: [],
  declarations: [
    ModelValidationSearchComponent,
    ModelValidationArtifactsComponent,
    PipelineComponent,
    ModelTrainingComponent,
    ModelDeploymentComponent,
    ModelServingComponent,
    ModelDeleteConfirmationComponent,
    PipelineGraphComponent,
  ],
})
export class MaterialComponentsModule {}
