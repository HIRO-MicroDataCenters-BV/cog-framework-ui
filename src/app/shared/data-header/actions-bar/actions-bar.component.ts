import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IActionItem } from '../types';
import { NgForOf } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatDialogModule } from '@angular/material/dialog';
import { AppDialogComponent } from 'src/app/components/app-modal/app-dialog.component';

@Component({
  selector: 'app-actions-bar',
  imports: [
    MatButtonModule,
    NgForOf,
    AppDialogComponent,
    TranslocoPipe,
    MatDialogModule,
  ],
  standalone: true,
  templateUrl: './actions-bar.component.html',
  styleUrl: './actions-bar.component.scss',
})
export class AppActionsBarComponent {
  @Input()
  get items(): IActionItem[] {
    return this._items;
  }
  set items(items: IActionItem[]) {
    this._items = items;
  }
  _items: IActionItem[] = [];
}
