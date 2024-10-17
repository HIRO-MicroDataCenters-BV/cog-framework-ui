import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { MatOption } from '@angular/material/autocomplete';
import { MatFormField, MatPrefix, MatSelect } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

export type SearcherOption = {
  key: string;
  label: string;
};

type SearcherEvent = {
  key: string;
  query: string;
};

@Component({
  selector: 'app-searcher',
  templateUrl: './app-searcher.component.html',
  standalone: true,
  styleUrls: ['./app-searcher.component.scss'],
  imports: [
    KeyValuePipe,
    MatOption,
    MatSelect,
    MatFormField,
    MatInput,
    ReactiveFormsModule,
    FormsModule,
    MatIcon,
    MatPrefix,
  ],
})
export class AppSearcherComponent {
  @Output() changeEvent = new EventEmitter<SearcherEvent>();
  @Input() options: SearcherOption[] = [
    { key: 'name', label: 'Model Name' },
    { key: 'id', label: 'Model Id' },
  ];
  key: string = this.options[0].key;
  query: string = '';
  private searchSubject = new Subject<void>();

  constructor() {
    this.searchSubject.pipe(debounceTime(150)).subscribe(() => {
      this.emitSearchEvent();
    });
  }

  search() {
    this.searchSubject.next();
  }

  private emitSearchEvent() {
    console.log('Search value:', {
      key: this.key,
      query: this.query,
    });
    this.changeEvent.emit({ key: this.key, query: this.query });
  }
}
