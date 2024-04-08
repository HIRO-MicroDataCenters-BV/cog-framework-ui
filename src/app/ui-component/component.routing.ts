import { Routes } from '@angular/router';


import {ModelComponent} from "./model/model.component";
import {DatasetComponent} from "./dataset/dataset.component";

export const MaterialRoutes: Routes = [
  {
    path: 'model',
    component: ModelComponent
  },
  {
    path: 'dataset',
    component: DatasetComponent
  }
];
