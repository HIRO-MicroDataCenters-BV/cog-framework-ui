import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-actions-bar',
  imports: [MatButtonModule],
  standalone: true,
  templateUrl: './actions-bar.component.html',
  styleUrl: './actions-bar.component.scss',
})
export class AppActionsBarComponent {}
