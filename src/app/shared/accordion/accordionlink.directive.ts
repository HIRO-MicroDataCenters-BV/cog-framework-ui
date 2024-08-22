import {
  Directive,
  HostBinding,
  Inject,
  Input,
  OnInit,
  OnDestroy,
} from '@angular/core';

import { AccordionDirective } from './accordion.directive';

@Directive({
  selector: '[appAccordionLink]',
})
export class AccordionLinkDirective implements OnInit, OnDestroy {
  @Input()
  public group: string | undefined;

  @HostBinding('class.selected')
  @Input()
  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    this._selected = value;
    if (value) {
      this.nav.closeOtherLinks(this);
    }
  }

  protected _selected: boolean = false;
  protected nav: AccordionDirective;

  constructor(@Inject(AccordionDirective) nav: AccordionDirective) {
    this.nav = nav;
  }

  ngOnInit(): void {
    this.nav.addLink(this);
  }

  ngOnDestroy(): void {
    this.nav.removeGroup(this);
  }

  toggle(): void {
    this.selected = !this.selected;
  }
}
