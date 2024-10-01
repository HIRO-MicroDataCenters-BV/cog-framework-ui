import { Component } from '@angular/core';

@Component({
  selector: 'app-searcher',
  templateUrl: './app-searcher.component.html',
  standalone: true,
  styleUrls: ['./app-searcher.component.scss'],
})
export class AppSearcherComponent {
  searchValue: string = '';

  constructor() {}

  search() {
    console.log('Search value:', this.searchValue);
  }
}
