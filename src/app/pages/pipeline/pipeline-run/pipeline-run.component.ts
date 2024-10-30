import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SvgIconComponent } from 'angular-svg-icon';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs/internal/Subscription';
import { NgClass, NgForOf, NgIf, DatePipe } from '@angular/common';
import { PIPELINE_STATUS_TYPES } from '../consts';
import { RouterModule } from '@angular/router';
import { flatten, getFormattedDiff, getRoot } from 'src/app/utils';
import { timeInterval, interval } from 'rxjs';

import {
  Pipeline,
  PipelineStatusType,
  PipelineTask,
} from 'src/app/model/Pipeline';

@Component({
  selector: 'app-pipeline-run',
  standalone: true,
  imports: [
    MatCardModule,
    SvgIconComponent,
    MatIconModule,
    NgClass,
    NgForOf,
    NgIf,
    DatePipe,
    RouterModule,
  ],
  templateUrl: './pipeline-run.component.html',
  styleUrls: ['./pipeline-run.component.scss'],
})
export class AppPipelineRunComponent implements OnInit, OnDestroy {
  subscribes: Subscription[] | undefined = [];
  @Input()
  get data(): Pipeline {
    return this._data;
  }
  set data(data: Pipeline) {
    this._data = data;
    this.root = this.getRoot(data);
  }
  _data!: Pipeline;
  root!: PipelineTask;
  // TODO: RM after fix run_id in API
  linkId: string = 'afcf98bb-a9af-4a34-a512-1236110150ae';

  duration: string = '';

  isRealtime: boolean = false;

  types = PIPELINE_STATUS_TYPES;

  ngOnInit(): void {
    this.tickTimer();
  }

  ngOnDestroy(): void {
    if (this.subscribes) {
      this.subscribes?.forEach((item) => item.unsubscribe());
    }
  }

  getRoot(data: Pipeline): PipelineTask {
    return getRoot(data);
  }

  hasError(status: string) {
    status = status?.toLocaleLowerCase() as PipelineTask['status'];
    return status === 'error' || status === 'failed';
  }

  isPending(status: string) {
    status = status?.toLocaleLowerCase() as PipelineTask['status'];
    return status === 'pending' || status === 'omitted';
  }

  flatten(data: PipelineTask | PipelineTask[]) {
    return flatten(data);
  }

  tickTimer() {
    const startedAt = this.root.startedAt;
    const finishedAt = this.root.finishedAt;
    this.setDuration(startedAt, finishedAt);
    if (this.isRealtime) {
      const sec = interval(1000).pipe(timeInterval());
      const subscription = sec.subscribe(() => {
        this.setDuration(startedAt, finishedAt);
      });
      this.subscribes?.push(subscription);
    }
  }
  getProgress(): PipelineStatusType[] {
    const result: PipelineStatusType[] = [];
    if (this.root) {
      const flatTree: PipelineTask[] = this.flatten(
        this.root.children,
      ) as PipelineTask[];
      console.log('sss', flatTree);
      for (const task of flatTree) {
        const status = task.status.toLowerCase();
        result.push({
          key: task.name.toLowerCase(),
          name: task.name.replace('-', ' '),
          error: this.hasError(status as PipelineTask['status']),
          completed: !this.isPending(status as PipelineTask['status']),
        });
      }
    }
    return result;
  }
  setDuration(startedAt: string, finishedAt: string) {
    this.duration = getFormattedDiff(startedAt, finishedAt);
  }
}
