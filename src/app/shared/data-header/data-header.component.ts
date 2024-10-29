import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppActionsBarComponent } from './actions-bar/actions-bar.component';
import { AppFiltersComponent } from './filters/filters.component';
import { AppTabsComponent } from './tabs/tabs.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { IActionItem, ITabItem } from './types';
import { MatTabNavPanel } from '@angular/material/tabs';
import { NgIf, NgClass } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  AppSearcherComponent,
  SearcherEvent,
  SearcherOption,
} from 'src/app/components/app-searcher/app-searcher.component';
import { PAGE_SIZE_OPTIONS, RESPONSE_CODE } from 'src/app/constants';
import { CogFrameworkApiService } from 'src/app/service/cog-framework-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GetPipelineParams, Pipeline } from 'src/app/model/Pipeline';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-data-header',
  imports: [
    AppActionsBarComponent,
    AppFiltersComponent,
    AppTabsComponent,
    MatGridListModule,
    MatToolbarModule,
    NgIf,
    NgClass,
    TranslocoPipe,
    AppSearcherComponent,
  ],
  standalone: true,
  templateUrl: './data-header.component.html',
  styleUrl: './data-header.component.scss',
})
export class AppDataHeaderComponent implements OnInit {
  @Input() hasFilter: boolean = true;
  @Input() tabPanel: MatTabNavPanel | null = null;

  @Input() tabs: ITabItem[] = [];
  @Input() actions: IActionItem[] = [];
  @Output() changeData = new EventEmitter<Pipeline>();

  loading: boolean = false;

  pageSizeOptions = PAGE_SIZE_OPTIONS;
  searchOptions: SearcherOption[] = [
    { key: 'name', label: 'Name', inputType: 'text' },
    { key: 'id', label: 'Id', inputType: 'text' },
  ];
  //[...DEF_SEARCH_PARAMS];

  // TODO: RM dummy data after release api for pipelines list
  defaultSearchQuery = '';
  defaultSearchOptionKey = 'id';

  limit = this.pageSizeOptions[0];
  page = 1;
  total = 0;

  id = 'afcf98bb-a9af-4a34-a512-1236110150ae';
  name = '';

  dataSource = new MatTableDataSource();

  pagigation = {
    limit: this.pageSizeOptions[0],
    page: 1,
    total: 0,
  };

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.search();
    this.route.queryParams.subscribe((data) => {
      //TODO: rm params after standartizide
      const params = { ...data };
      if (params['name']) {
        this.name = params['name'];
        params['run_name'] = this.name;
        this.defaultSearchQuery = this.name;
      }
      if (params['id']) {
        this.id = params['id'];
        params['run_id'] = this.id;
        this.defaultSearchQuery = this.id;
      }
      if (params['key']) {
        this.defaultSearchOptionKey = params['key'];
      }
      if (params['limit']) {
        this.limit = params['limit'];
      }
      if (params['page']) {
        this.page = params['page'];
      }
      this.getPipelines({ ...params });
    });
    this.defaultSearchOptionKey = this.name ? 'name' : 'id';
    this.defaultSearchQuery = this.name || this.id;
  }

  getPipelines(params: GetPipelineParams = {}): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getPipelineByRun(params);
    console.log('getPipelines', params);
    response.subscribe({
      next: (res) => {
        if (res) {
          /*
          const pagination = res.pagination;
          this.total = pagination.total_items;
          this.page = pagination.page;
          this.limit = pagination.limit;
          */
          //console.log('res', res.data);
          //this.dataSource.data = res.data;
          this.changeData.emit({ ...res.data });
        }
      },
      error: (e) => {
        this.changeData.emit();
        if (e.status === RESPONSE_CODE.NOT_FOUND) {
          this.dataSource.data = [];
        }
        //this.getError(e.error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  search(event: SearcherEvent = { key: 'name', query: '' }): void {
    const params: GetPipelineParams = event.query
      ? { [event.key]: event.query }
      : {};

    if (params['id']) {
      this.id = params['id'];
      this.defaultSearchQuery = this.id;
      params['id'] = this.id;
      params['run_id'] = this.id;
    } else {
      params['run_id'] = this.id;
      params['run_name'] = this.name;
    }
    if (params['key']) {
      this.defaultSearchOptionKey = params['key'];
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'replace',
    });
  }
}
