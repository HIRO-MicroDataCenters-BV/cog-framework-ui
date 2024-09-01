import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layouts/main/main.component';

export const AppRoutes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
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
