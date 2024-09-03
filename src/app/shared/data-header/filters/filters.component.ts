import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [MatButtonModule, MatIcon, SvgIconComponent],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.scss',
})
export class AppFiltersComponent {}
