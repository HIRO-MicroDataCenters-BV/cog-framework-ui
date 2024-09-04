import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IActionItem } from '../types';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-actions-bar',
  imports: [MatButtonModule, NgForOf],
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
