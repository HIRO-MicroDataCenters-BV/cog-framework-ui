import { Component, Input } from '@angular/core';
import { ITabItem } from '../types';
import { RouterModule } from '@angular/router';
import { NgForOf } from '@angular/common';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-tabs',
  imports: [MatTabsModule, RouterModule, NgForOf],
  standalone: true,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class AppTabsComponent {
  activeLink: string | undefined;
  @Input() tabPanel!: MatTabNavPanel;
  @Input()
  get items(): ITabItem[] {
    return this._items;
  }
  set items(items: ITabItem[]) {
    this._items = items;
  }
  _items: ITabItem[] = [];
}
