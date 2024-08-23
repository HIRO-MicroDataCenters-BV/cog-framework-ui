import { Routes } from '@angular/router';

import { FullComponent } from './layouts/full/full.component';

export const AppRoutes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/model',
        pathMatch: 'full',
      },
      {
        path: '',
        loadChildren: () =>
          import('./ui-component/component.module').then(
            (m) => m.MaterialComponentsModule,
          ),
      },
    ],
  },
];
