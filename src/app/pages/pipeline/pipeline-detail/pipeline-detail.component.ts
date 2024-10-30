import { Component, OnInit, OnDestroy } from '@angular/core';
//import { IRun } from '../types';
import { IActionItem, ITabItem } from 'src/app/shared/data-header/types';
import { Subscription } from 'rxjs';
//import { mocks } from 'src/app/mocks';
import { ActivatedRoute } from '@angular/router';
import { PipelineRunOutputComponent } from '../pipeline-run-output/pipeline-run-output.component';
import { Pipeline } from 'src/app/model/Pipeline';
import { CogFrameworkApiService } from 'src/app/service/cog-framework-api.service';

@Component({
  selector: 'app-pipeline-detail',
  templateUrl: './pipeline-detail.component.html',
  styleUrls: ['./pipeline-detail.component.scss'],
})
export class PipelineDetailComponent implements OnDestroy, OnInit {
  loading: boolean = false;
  subscribes: Subscription[] = [];
  data: Pipeline | null = null;
  id: string | undefined;

  actions: IActionItem[] = [
    {
      label: 'retry',
      action: () => {},
      disabled: false,
    },
    {
      label: 'clone',
      action: () => {},
      disabled: false,
    },
    {
      label: 'terminate',
      action: () => {},
      disabled: true,
    },
    {
      label: 'archive',
      action: () => {},
      disabled: false,
    },
  ];

  tabs: ITabItem[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private cogFrameworkApiService: CogFrameworkApiService,
  ) {
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
    if (this.data) {
      component.data = this.data;
    }
  }

  fetch(): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getPipelineByRun({
      run_id: this.id,
    });
    response.subscribe({
      next: (res) => {
        if (res) {
          this.data = res.data;
          this.tabs = [
            {
              label: 'Graph',
              link: ['/runs', this.id as string, 'graph'],
            },
            {
              label: 'Run output',
              link: ['/runs', this.id as string, 'run-output'],
            },
            {
              label: 'Config',
              link: ['/runs', this.id as string, 'config'],
            },
          ];
        }
      },
      error: (e) => {
        this.data = null;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
