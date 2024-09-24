import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IPipelineStatusType, IRun } from '../types';
import { MatCardModule } from '@angular/material/card';
import { SvgIconComponent } from 'angular-svg-icon';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs/internal/Subscription';
import { timeInterval, interval } from 'rxjs';
import { NgClass, NgForOf, NgIf, DatePipe } from '@angular/common';
import { PIPELINE_STATUS_TYPES } from '../consts';
import { RouterModule } from '@angular/router';
import { getFormattedDiff } from 'src/app/utils';

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
  get data(): IRun {
    return this._data;
  }
  set data(data: IRun) {
    this._data = data;
  }
  _data!: IRun;

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

  tickTimer() {
    const startAt = this.data.startAt;
    this.setDuration(startAt);
    if (this.isRealtime) {
      const sec = interval(1000).pipe(timeInterval());
      const subscription = sec.subscribe(() => {
        this.setDuration(startAt);
      });
      this.subscribes?.push(subscription);
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
      const error = (phase == i && status?.error) ?? false;

      if (name) {
        result.push({
          key,
          name,
          error,
          completed: phase > i,
        });
      }
      i++;
    });
    return result;
  }
  setDuration(startAt: Date) {
    this.duration = getFormattedDiff(startAt);
  }
}
