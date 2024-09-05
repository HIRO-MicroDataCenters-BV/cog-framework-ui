import { BreakpointState } from '@angular/cdk/layout';
import { Component, OnDestroy } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MenuItems } from '../../shared/menu-items/menu-items';
import { Subject } from 'rxjs';

/** @title Responsive sidenav */
@Component({
  selector: 'app-main-layout',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainLayoutComponent implements OnDestroy {
  mobileQuery!: BreakpointState;
  isSidebarOpen: boolean = true;
  destroyed = new Subject<void>();

  constructor(
    breakpointObserver: BreakpointObserver,
    public menuItems: MenuItems,
  ) {
    const layoutChanges = breakpointObserver.observe(['(max-width: 1024px)']);

    layoutChanges.subscribe((res) => {
      this.mobileQuery = res;
      this.isSidebarOpen = !res.matches;
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
