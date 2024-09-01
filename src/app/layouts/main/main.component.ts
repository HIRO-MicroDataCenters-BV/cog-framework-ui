import { MediaMatcher } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { MenuItems } from '../../shared/menu-items/menu-items';

/** @title Responsive sidenav */
@Component({
  selector: 'app-main-layout',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainLayoutComponent {
  mobileQuery: MediaQueryList;
  isSidebarOpen: boolean = false;
  constructor(
    media: MediaMatcher,
    public menuItems: MenuItems,
  ) {
    this.mobileQuery = media.matchMedia('(min-width: 1024px)');
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;

    console.log('is', this.isSidebarOpen);
  }
}
