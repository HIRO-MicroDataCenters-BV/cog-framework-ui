import "hammerjs";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HttpClientModule } from "@angular/common/http";
import { CommonModule } from "@angular/common";

import { DemoMaterialModule } from "../demo-material-module";
import { CdkTableModule } from "@angular/cdk/table";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { MaterialRoutes } from "./component.routing";
import { ModelValidationSearchComponent } from "./model-validation-search/model-validation-search.component";
import { ModelValidationArtifactsComponent } from "./model-validation-artifacts/model-validation-artifacts.component";
import { PipelineComponent } from "./pipeline/pipeline.component";
import { ModelTrainingComponent } from "./model-training/model-training.component";
import { ModelDeploymentComponent } from "./model-deployment/model-deployment.component";
import { ModelServingComponent } from "./model-serving/model-serving.component";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(MaterialRoutes),
    DemoMaterialModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CdkTableModule,
  ],
  providers: [],
  declarations: [
    ModelValidationSearchComponent,
    ModelValidationArtifactsComponent,
    PipelineComponent,
    ModelTrainingComponent,
    ModelDeploymentComponent,
    ModelServingComponent,
  ],
})
export class MaterialComponentsModule {}
