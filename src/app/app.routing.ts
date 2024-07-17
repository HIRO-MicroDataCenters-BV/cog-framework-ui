import { Routes } from "@angular/router";

import { FullComponent } from "./layouts/full/full.component";

export const AppRoutes: Routes = [
  {
    path: "",
    component: FullComponent,
    children: [
      {
        path: "",
        redirectTo: "/dashboard",
        pathMatch: "full",
      },
      {
        path: "",
        loadChildren: () =>
          import("./ui-component/component.module").then(
            (m) => m.MaterialComponentsModule,
          ),
      },
      {
        path: "dashboard",
        loadChildren: () =>
          import("./dashboard/dashboard.module").then((m) => m.DashboardModule),
      },
    ],
  },
];
