import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  inputType?: 'text' | 'number';
};

export type SearcherEvent = {
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
export class AppSearcherComponent implements OnInit {
  @Output() updated = new EventEmitter<SearcherEvent>();
  @Input() options: SearcherOption[] = [
    { key: 'name', label: '', inputType: 'text' },
  ];
  query: string = '';
  private _selectedOption: SearcherOption = { key: '', label: '' };
  @Input() set selectedOption(value: SearcherOption) {
    this._selectedOption = value;
    this.query = '';
  }

  get selectedOption() {
    return this._selectedOption;
  }

  private searchSubject = new Subject<void>();

  constructor() {
    this.searchSubject.pipe(debounceTime(150)).subscribe(() => {
      this.emitSearchEvent();
    });
  }

  ngOnInit() {
    this.selectedOption = this.options[0];
  }

  search() {
    this.searchSubject.next();
  }

  private emitSearchEvent() {
    this.updated.emit({ key: this.selectedOption.key, query: this.query });
  }
}
