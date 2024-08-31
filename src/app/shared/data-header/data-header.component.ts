import { Component } from '@angular/core';
import { AppActionsBarComponent } from './actions-bar/actions-bar.component';
import { AppFiltersComponent } from './filters/filters.component';
import { AppTabsComponent } from './tabs/tabs.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-data-header',
  imports: [
    AppActionsBarComponent,
    AppFiltersComponent,
    AppTabsComponent,
    MatGridListModule,
    MatToolbarModule,
  ],
  standalone: true,
  templateUrl: './data-header.component.html',
  styleUrl: './data-header.component.scss',
})
export class AppDataHeaderComponent {}
