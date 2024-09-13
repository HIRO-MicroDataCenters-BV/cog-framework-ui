import {
  Component,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  AfterContentInit,
} from '@angular/core';
import { ITabItem } from '../types';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { NgForOf } from '@angular/common';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { filter } from 'rxjs/internal/operators/filter';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tabs',
  imports: [MatTabsModule, RouterModule, NgForOf],
  standalone: true,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class AppTabsComponent implements OnDestroy, AfterContentInit {
  activeLink: string | string[] = '';
  @Input() tabPanel!: MatTabNavPanel;
  @Input()
  get items(): ITabItem[] {
    return this._items;
  }
  set items(items: ITabItem[]) {
    this._items = items;
  }
  _items: ITabItem[] = [];
  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  subscribe: Subscription | undefined;

  ngAfterContentInit(): void {
    this.subscribe = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.activeLink = e?.urlAfterRedirects ?? e?.url;
        this.cdr.detectChanges();
      });
    this.activeLink = this.router.url;
  }
  ngOnDestroy(): void {
    this.subscribe?.unsubscribe();
  }
}
