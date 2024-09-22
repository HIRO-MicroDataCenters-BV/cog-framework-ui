import {
  AfterViewInit,
  AfterContentInit,
  Directive,
  ElementRef,
  Input,
  Renderer2,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { fromEvent, interval, Subject, Subscription, timer } from 'rxjs';
import {
  debounceTime,
  throttleTime,
  delay,
  tap,
  takeUntil,
  take,
} from 'rxjs/operators';

@Directive({
  selector: '[appFluidHeight]',
})
export class AppFluidHeightDirective implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() minHeight: number = 50;
  @Input() topOffset: number | undefined;
  @Input() margin: number = 0;

  private ms: number = 500;

  private domElement: HTMLElement;

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
  ) {
    this.domElement = this.elementRef.nativeElement as HTMLElement;

    this.subscriptions.push(
      fromEvent(window, 'resize')
        .pipe(throttleTime(this.ms), debounceTime(this.ms))
        .subscribe(() => this.setHeight()),
    );
  }

  ngOnInit() {
    this.subscriptions.push(
      timer(this.ms)
        .pipe(take(1))
        .subscribe(() => this.setHeight()),
    );
  }

  private setHeight() {
    const windowHeight = window?.innerHeight;
    const topOffset = this.topOffset || this.calcTopOffset();
    let height = windowHeight - topOffset - this.margin * 2;

    if (this.minHeight && height < this.minHeight) {
      height = this.minHeight;
    }
    this.renderer.setStyle(this.domElement, 'height', `${height}px`);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((item) => item.unsubscribe());
  }

  private calcTopOffset(): number {
    try {
      const rect = this.domElement.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      return rect.top + scrollTop;
    } catch (e) {
      return 0;
    }
  }
}
