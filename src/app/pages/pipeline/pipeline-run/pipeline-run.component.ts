import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SvgIconComponent } from 'angular-svg-icon';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs/internal/Subscription';
import { NgClass, NgForOf, NgIf, DatePipe } from '@angular/common';
import { PIPELINE_STATUS_TYPES } from '../consts';
import { RouterModule } from '@angular/router';
import { getFormattedDiff } from 'src/app/utils';
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
    const tasks = data.task_structure;
    const nodes = Object.keys(data.task_structure);
    return tasks[nodes[0]];
  }

  hasError(status: PipelineTask['status']) {
    return status === 'Error';
  }

  isPending(status: PipelineTask['status']) {
    return status === 'Pending';
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
        0,
        null,
      ) as PipelineTask[];
      for (const task of flatTree) {
        result.push({
          key: task.name.toLowerCase(),
          name: task.name.replace('-', ' '),
          error: this.hasError(task.status),
          completed: !this.isPending(task.status),
        });
      }
    }
    return result;
  }
  flatten(
    data: PipelineTask | PipelineTask[],
    level = 0,
    parent: PipelineTask | null = null,
  ) {
    const result: unknown[] = [];

    if (!data) {
      return result;
    }

    if (Array.isArray(data)) {
      data.forEach((item) =>
        result.push(...this.flatten(item, level + 1, data[0])),
      );
    } else {
      result.push({ ...data, level, parent });
      result.push(...this.flatten(data.children, level + 1, data));
    }

    return result;
  }
  setDuration(startedAt: string, finishedAt: string) {
    this.duration = getFormattedDiff(startedAt, finishedAt);
  }
}
