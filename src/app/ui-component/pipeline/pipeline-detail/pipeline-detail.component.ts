import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IPipelineStatusType, IRun } from '../types';
import { IActionItem, ITabItem } from 'src/app/shared/data-header/types';
import { PIPELINE_STATUS_TYPES } from '../consts';
import { Subscription, timeInterval, interval } from 'rxjs';
import { getFormattedDiff } from 'src/app/utils';

@Component({
  selector: 'app-pipeline-detail',
  templateUrl: './pipeline-detail.component.html',
  styleUrls: ['./pipeline-detail.component.scss'],
})
export class PipelineDetailComponent implements OnInit, OnDestroy {
  // NOTE: A MOCK DATA FOR RUNS
  // TODO: Remove a mock data after connection to the API
  @Input() data: IRun = {
    id: 1,
    name: 'Add_pipeline 2024-07-08-17-34-50',
    experiment: 'Default',
    version: 375,
    startAt: new Date('2024-07-21'),
    endAt: new Date(),
    status: { error: true, phase: 3 },
    completed: false,
    data: {
      inputOutput: {
        inputParameter:
          'https://raw.githubusercontent.com/Barteus/kubeflow-examples/main/e2e-wine-kfp-mlflow-red.csv',
        inputArtiacts:
          'https://raw.githubusercontent.com/Barteus/kubeflow-examples/main/e2e-wine-kfp-mlflow-red.csv',
        outputArtifacts:
          'https://raw.githubusercontent.com/Barteus/kubeflow-examples/main/e2e-wine-kfp-mlflow-red.csv',
        url: 'https://raw.githubusercontent.com/Barteus/kubeflow-examples/main/e2e-wine-kfp-mlflow-red.csv',
        data: {
          file: 'https://raw.githubusercontent.com/Barteus/kubeflow-examples/main/e2e-wine-kfp-mlflow-red.csv.tar.gz',
          plain: 'function x() {\nconsole.log("Hello world!");\n}',
        },
      },
      details: {
        taskId: 'pupupu-45353453',
        taskName: 'Any task',
        status: 0,
      },
      events: 'function x() {\nconsole.log("Hello world!");\n}',
      logs: 'function x() {\nconsole.log("Hello world!");\n}',
    },
  };

  editorOpts = {
    theme: 'vs',
    language: 'javascript',
    readOnly: true,
    automaticLayout: true,
  };

  actions: IActionItem[] = [
    {
      label: 'Retray',
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

  tabs: ITabItem[] = [
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

  duration: string = '';

  subscribes: Subscription[] | undefined = [];

  isRealtime: boolean = false;

  types = PIPELINE_STATUS_TYPES;

  iconPhaseSize = 84;

  progress: IPipelineStatusType[] = [];

  ngOnInit(): void {
    this.progress = this.getProgress();
    if (this.data) {
      this.tickTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.subscribes) {
      this.subscribes?.forEach((item) => item.unsubscribe());
    }
  }

  getProgress(): IPipelineStatusType[] {
    const list = this.types;
    const status = this.data?.status;
    const result: IPipelineStatusType[] = [];
    let i = 0;
    Object.keys(list).forEach((key) => {
      const name = list[key as keyof typeof list];
      const phase = status?.phase ?? 0;
      const error = (phase === i && status?.error) ?? false;

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
  }

  getStatus(id: number = 0) {
    return ['Failed', 'Successfull'][id];
  }

  tickTimer() {
    if (this.data) {
      const startAt = this.data?.startAt;
      if (startAt) {
        this.setDuration(startAt);
        if (this.isRealtime) {
          const sec = interval(1000).pipe(timeInterval());
          const subscription = sec.subscribe(() => {
            this.setDuration(startAt);
          });
          this.subscribes?.push(subscription);
        }
      }
    }
  }
  setDuration(startAt: Date) {
    this.duration = getFormattedDiff(startAt);
  }
}
