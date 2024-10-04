import { Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export interface Menu {
  state: string;
  name: string;
  type: string;
  icon: string;
}

const MENU_ITEMS: Menu[] = [
  {
    state: 'model',
    type: 'link',
    name: 'menu.section.model',
    icon: 'crop_7_5',
  },
  {
    state: 'dataset',
    type: 'link',
    name: 'menu.section.dataset',
    icon: 'border_horizontal',
  },
  {
    state: 'model-training',
    type: 'link',
    name: 'menu.section.model_training',
    icon: 'all_inclusive',
  },
  {
    state: 'model-serving',
    type: 'link',
    name: 'menu.section.model_serving',
    icon: 'developer_mode',
  },
  {
    state: 'model-validation',
    type: 'link',
    name: 'menu.section.model_validation',
    icon: 'av_timer',
  },
  {
    state: 'runs',
    type: 'link',
    name: 'menu.section.runs',
    icon: 'directions_run',
  },
];

@Injectable()
export class MenuItems {
  constructor(private translocoService: TranslocoService) {}
  getMenuitem(): Menu[] {
    return MENU_ITEMS;
  }
}
