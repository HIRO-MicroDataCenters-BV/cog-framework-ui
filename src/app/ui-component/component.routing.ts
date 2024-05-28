import {Routes} from '@angular/router';


import {ModelComponent} from "./model/model.component";
import {DatasetComponent} from "./dataset/dataset.component";
import {ModelDetailComponent} from "./model-detail/model-detail.component";
import {DatasetDetailComponent} from "./dataset-detail/dataset-detail.component";
import {ModelValidationComponent} from "./model-validation/model-validation.component";
import {ModelValidationSearchComponent} from "./model-validation-search/model-validation-search.component";
import {ModelValidationArtifactsComponent} from "./model-validation-artifacts/model-validation-artifacts.component";

export const MaterialRoutes: Routes = [
    {
        path: 'model',
        component: ModelComponent
    },
    {
        path: 'model-detail',
        component: ModelDetailComponent
    },
    {
        path: 'dataset',
        component: DatasetComponent
    },
    {
        path: 'dataset-detail',
        component: DatasetDetailComponent
    },
    {
        path: 'model-validation',
        component: ModelValidationSearchComponent
    },
    {
        path: 'model-validation-artifacts',
        component: ModelValidationArtifactsComponent
    }
];
