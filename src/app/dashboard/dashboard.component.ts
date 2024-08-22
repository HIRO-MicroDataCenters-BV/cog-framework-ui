import { Component } from '@angular/core';
import { SalesOverviewComponent } from './dashboard-components/sales-overview/sales-overview.component';
import { OurVisiterComponent } from './dashboard-components/our-visiter/our-visiter.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SalesOverviewComponent, OurVisiterComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {}
