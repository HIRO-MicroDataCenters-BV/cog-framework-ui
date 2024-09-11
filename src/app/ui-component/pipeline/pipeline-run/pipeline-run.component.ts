import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IRun } from '../types';
import { MatCardModule } from '@angular/material/card';
import { SvgIconComponent } from 'angular-svg-icon';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs/internal/Subscription';
import { timeInterval, interval } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-pipeline-run',
  standalone: true,
  imports: [MatCardModule, SvgIconComponent, MatIconModule, NgClass],
  templateUrl: './pipeline-run.component.html',
  styleUrls: ['./pipeline-run.component.scss'],
})
export class AppPipelineRunComponent implements OnInit, OnDestroy {
  @Input()
  get data(): IRun | null {
    return this._data;
  }
  set data(data: IRun) {
    this._data = data;
  }
  _data: IRun | null = null;

  timer: string = '';

  subscribes: Subscription[] | undefined = [];

  ngOnInit(): void {
    if (this.data) {
      this.tickTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.subscribes) {
      this.subscribes?.forEach((item) => item.unsubscribe());
    }
  }

  getFormattedDiff(startAt: Date | undefined): string {
    if (startAt) {
      const now: Date = new Date();
      const differenceInMs = now.getTime() - startAt.getTime();
      const differenceInSeconds = Math.floor(differenceInMs / 1000);
      const seconds = differenceInSeconds % 60;
      const minutes = Math.floor(differenceInSeconds / 60) % 60;
      const hours = Math.floor(differenceInSeconds / 3600);
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      return formattedTime;
    }
    return '';
  }
  tickTimer() {
    if (this.data) {
      const sec = interval(1000).pipe(timeInterval());
      const subscription = sec.subscribe(() => {
        this.timer = this.getFormattedDiff(this.data?.startAt);
      });
      this.subscribes?.push(subscription);
    }
  }
}
