import { Component, Input, OnInit } from '@angular/core';
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

  @Input() path: string = '';
  options: AnimationOptions = {};

  ngOnInit(): void {
    this.options = {
      path: `${this.basePath}${this.path}`,
    };
  }
}
