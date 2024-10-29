import { Component, Input, OnInit } from '@angular/core';
import { PIPELINE_STATUS_TYPES } from '../consts';
import { Subscription, timeInterval, interval } from 'rxjs';
import { getFormattedDiff } from 'src/app/utils';
import { ITabItem } from 'src/app/shared/data-header/types';
import {
  Pipeline,
  PipelineStatusType,
  PipelineTask,
} from 'src/app/model/Pipeline';

@Component({
  selector: 'app-pipeline-run-output',
  templateUrl: './pipeline-run-output.component.html',
  styleUrls: ['./pipeline-run-output.component.scss'],
})
export class PipelineRunOutputComponent implements OnInit {
  subscribes: Subscription[] = [];
  @Input() data!: Pipeline;

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

  getProgress(): PipelineStatusType[] {
    return [];
    // TODO: REMOVE AFTER API CONNECT
    /*
    const list = this.types;
    const status = this.data?.status;
    const result: PipelineStatusType[] = [];
    let i = 0;
    Object.keys(list).forEach((key) => {
      const name = list[key as keyof typeof list];
      const phase = 0; //status?.phase ?? 0;
      const error = false; //(phase === i && status?.error) ?? false;

      if (name) {
        result.push({
          key,
          name,
          error,
          completed: phase > i,
          icon: `icon-${key}.json`,
        });
      }
      i++;
    });
    return result;
    */
  }

  getStatus(id: number = 0) {
    return ['Failed', 'Successfull'][id];
  }

  tickTimer() {
    /*
    if (this.data) {
      const startedAt = this.data?.startedAt;
      if (startAt) {
        this.setDuration(startedAt);
        if (this.isRealtime) {
          const sec = interval(1000).pipe(timeInterval());
          const subscription = sec.subscribe(() => {
            this.setDuration(startedAt);
          });
          this.subscribes?.push(subscription);
        }
      }
    }
      */
  }
  setDuration(startedAt: string, finishedAt: string) {
    this.duration = getFormattedDiff(startedAt, finishedAt);
  }
}
