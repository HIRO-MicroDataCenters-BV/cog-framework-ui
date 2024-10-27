import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  AsyncPipe,
  NgForOf,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PAGE_SIZE_OPTIONS } from 'src/app/constants';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    TranslocoPipe,
    AsyncPipe,
    NgForOf,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
  ],
  templateUrl: './app-table.component.html',
  styleUrl: './app-table.component.scss',
})
export class AppTableComponent implements OnInit {
  pageSizeOptions = PAGE_SIZE_OPTIONS;
  @Input() source!: () => unknown;
  @Input() query: string | unknown = '';
  @Input() displayColumns: string[] = [];
  @Input() selected: unknown = null;
  @Input() isMultipleSelect: boolean = false;
  @Output() changeSelect = new EventEmitter<void>();

  data: unknown[] = [];

  pagigation = {
    limit: this.pageSizeOptions[0],
    page: 1,
    total: 0,
  };

  ngOnInit(): void {
    console.log('init');
  }

  search() {
    console.log('search');
  }
}
