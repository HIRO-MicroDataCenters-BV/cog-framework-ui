import { Component, Input } from '@angular/core';
import { AppActionsBarComponent } from './actions-bar/actions-bar.component';
import { AppFiltersComponent } from './filters/filters.component';
import { AppTabsComponent } from './tabs/tabs.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { IActionItem, ITabItem } from './types';
import { MatTabNavPanel } from '@angular/material/tabs';

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
export class AppDataHeaderComponent {
  @Input() tabPanel!: MatTabNavPanel;
  tabs: ITabItem[] = [
    {
      label: 'Graph',
      link: 'graph',
    },
    {
      label: 'Run outpost',
      link: 'run-outpost',
    },
    {
      label: 'Config',
      link: 'config',
    },
  ];
  actions: IActionItem[] = [
    {
      label: '+ Create run',
      action: () => {},
      disabled: false,
    },
    {
      label: 'Compare runs',
      action: () => {},
      disabled: true,
    },
    {
      label: 'Clone run',
      action: () => {},
      disabled: true,
    },
    {
      label: 'Archive',
      action: () => {},
      disabled: true,
    },
    {
      label: 'Refresh',
      action: () => {},
      disabled: false,
    },
  ];
}
