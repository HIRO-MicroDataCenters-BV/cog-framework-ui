import { Component, Input, NgZone, OnInit } from '@angular/core';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';

@Component({
  selector: 'app-lottie',
  standalone: true,
  imports: [LottieComponent],
  templateUrl: './lottie.component.html',
})
export class AppLottieComponent implements OnInit {
  basePath = '/assets/lottie/';
  @Input()
  get width(): string {
    return this._width;
  }
  set width(width: number) {
    this._width = `${width}px`;
  }
  private _width = '';

  @Input()
  get height(): string {
    return this._height;
  }
  set height(height: number) {
    this._height = `${height}px`;
  }
  private _height = '';

  @Input() path: string | undefined = '';
  @Input() autoplay: boolean = true;
  options: AnimationOptions = {};

  animationItem: AnimationItem | undefined;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.options = {
      path: `${this.basePath}${this.path}`,
    };
  }

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    this.animationItem.autoplay = this.autoplay;
    if (!this.autoplay) {
      this.animationItem.goToAndStop(25, true);
    }
  }

  stop(): void {
    this.ngZone.runOutsideAngular(() => {
      if (this.animationItem) {
        this.animationItem.stop();
      }
    });
  }

  play(): void {
    this.ngZone.runOutsideAngular(() => {
      if (this.animationItem) {
        this.animationItem.play();
      }
    });
  }
}
