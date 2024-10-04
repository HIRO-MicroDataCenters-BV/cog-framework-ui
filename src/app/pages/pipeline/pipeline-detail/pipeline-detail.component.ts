import { Component, OnInit, OnDestroy } from '@angular/core';
import { IRun } from '../types';
import { IActionItem, ITabItem } from 'src/app/shared/data-header/types';
import { Subscription } from 'rxjs';
import { mocks } from 'src/app/mocks';
import { ActivatedRoute } from '@angular/router';
import { PipelineRunOutputComponent } from '../pipeline-run-output/pipeline-run-output.component';

@Component({
  selector: 'app-pipeline-detail',
  templateUrl: './pipeline-detail.component.html',
  styleUrls: ['./pipeline-detail.component.scss'],
})
export class PipelineDetailComponent implements OnDestroy, OnInit {
  subscribes: Subscription[] = [];
  // NOTE: A MOCK DATA FOR RUNS
  // TODO: Remove a mock data after connection to the API
  data: IRun | undefined;
  id: number | undefined;

  actions: IActionItem[] = [
    {
      label: 'Retry',
      action: () => {},
      disabled: false,
    },
    {
      label: 'Clone run',
      action: () => {},
      disabled: false,
    },
    {
      label: 'Terminate',
      action: () => {},
      disabled: true,
    },
    {
      label: 'Archive',
      action: () => {},
      disabled: false,
    },
  ];

  tabs: ITabItem[] = [];

  constructor(private activatedRoute: ActivatedRoute) {
    this.subscribes.push(
      this.activatedRoute.params.subscribe((params) => {
        this.id = params?.['id'];
      }),
    );
  }

  ngOnInit(): void {
    if (this.id) {
      this.fetch();
    }
  }

  ngOnDestroy(): void {
    if (this.subscribes) {
      this.subscribes?.forEach((item) => item.unsubscribe());
    }
  }

  onOutletLoaded(component: PipelineRunOutputComponent): void {
    console.log('a', this.data);
    if (this.data) {
      component.data = this.data;
    }
  }

  fetch(): void {
    // TODO: REMOVE AFTER API CONNECT
    this.data = mocks.runs.find((item) => item.id == this.id);
    if (this.data) {
      this.tabs = [
        {
          label: 'Graph',
          link: ['/runs', this.data.id as string, 'graph'],
        },
        {
          label: 'Run output',
          link: ['/runs', this.data.id as string, 'run-output'],
        },
        {
          label: 'Config',
          link: ['/runs', this.data.id as string, 'config'],
        },
      ];
    }
  }
}
