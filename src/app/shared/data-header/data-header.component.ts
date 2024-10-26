import { Component, Input } from '@angular/core';
import { AppActionsBarComponent } from './actions-bar/actions-bar.component';
import { AppFiltersComponent } from './filters/filters.component';
import { AppTabsComponent } from './tabs/tabs.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { IActionItem, ITabItem } from './types';
import { MatTabNavPanel } from '@angular/material/tabs';
import { NgIf, NgClass } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-data-header',
  imports: [
    AppActionsBarComponent,
    AppFiltersComponent,
    AppTabsComponent,
    MatGridListModule,
    MatToolbarModule,
    NgIf,
    NgClass,
    TranslocoPipe,
  ],
  standalone: true,
  templateUrl: './data-header.component.html',
  styleUrl: './data-header.component.scss',
})
export class AppDataHeaderComponent {
  @Input() hasFilter: boolean = true;
  @Input() tabPanel: MatTabNavPanel | null = null;

  @Input() tabs: ITabItem[] = [];
  @Input() actions: IActionItem[] = [];
}
