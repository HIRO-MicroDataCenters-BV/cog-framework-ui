import { Component, Input, OnInit } from '@angular/core';
import { PIPELINE_STATUS_TYPES } from '../consts';
import { Subscription, timeInterval, interval } from 'rxjs';
import { flatten, getFormattedDiff, getRoot } from 'src/app/utils';
import { ITabItem } from 'src/app/shared/data-header/types';
import {
  Pipeline,
  PipelineStatusType,
  PipelineTask,
} from 'src/app/model/Pipeline';
import { PIPELINE_ICONS_KEYS } from 'src/app/constants';

@Component({
  selector: 'app-pipeline-run-output',
  templateUrl: './pipeline-run-output.component.html',
  styleUrls: ['./pipeline-run-output.component.scss'],
})
export class PipelineRunOutputComponent implements OnInit {
  subscribes: Subscription[] = [];
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

  editorOpts = {
    theme: 'vs',
    language: 'javascript',
    readOnly: true,
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
  };

  duration: string = '';

  isRealtime: boolean = false;

  types = PIPELINE_STATUS_TYPES;

  iconsKeys = PIPELINE_ICONS_KEYS;

  iconPhaseSize = 84;

  progress: PipelineStatusType[] = [];

  detailTabs: ITabItem[] = [
    {
      label: 'Input/Output',
      key: 'inputOutput',
    },
    {
      label: 'Details',
      key: 'details',
    },
    {
      label: 'Logs',
      key: 'logs',
    },
    {
      label: 'Events',
      key: 'events',
    },
  ];

  ngOnInit(): void {
    if (this.data) {
      this.progress = this.getProgress();
      this.tickTimer();
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

  getIconKey(key: string): string {
    return this.iconsKeys.indexOf(key) > -1 ? key : 'preprocess';
  }

  getProgress(): PipelineStatusType[] {
    const result: PipelineStatusType[] = [];
    if (this.root) {
      const flatTree: PipelineTask[] = this.flatten(
        this.root.children,
      ) as PipelineTask[];
      for (const task of flatTree) {
        const status = task.status.toLowerCase();
        const key = task.name.toLowerCase();
        result.push({
          key,
          name: task.name.replace('-', ' '),
          error: this.hasError(status as PipelineTask['status']),
          completed: !this.isPending(status as PipelineTask['status']),
          icon: `icon-${this.getIconKey(key)}.json`,
        });
      }
    }
    return result;
  }

  getStatus(id: number = 0) {
    return ['Failed', 'Successfull'][id];
  }

  tickTimer() {
    if (this.data) {
      const startedAt = this.root?.startedAt;
      const finishedAt = this.root?.finishedAt;
      if (startedAt) {
        this.setDuration(startedAt, finishedAt);
        if (this.isRealtime) {
          const sec = interval(1000).pipe(timeInterval());
          const subscription = sec.subscribe(() => {
            this.setDuration(startedAt, finishedAt);
          });
          this.subscribes?.push(subscription);
        }
      }
    }
  }
  setDuration(startedAt: string, finishedAt: string) {
    this.duration = getFormattedDiff(startedAt, finishedAt);
  }
}
