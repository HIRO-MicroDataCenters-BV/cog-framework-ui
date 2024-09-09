import { Injectable } from '@angular/core';

export interface Menu {
  state: string;
  name: string;
  type: string;
  icon: string;
}

const MENU_ITEMS: Menu[] = [
  // { state: 'dashboard', name: 'Dashboard', type: 'link', icon: 'av_timer' },
  { state: 'model', type: 'link', name: 'Model Management', icon: 'crop_7_5' },
  {
    state: 'dataset',
    type: 'link',
    name: 'Dataset Management',
    icon: 'border_horizontal',
  },
  {
    state: 'model-training',
    type: 'link',
    name: 'Model Training',
    icon: 'all_inclusive',
  },
  {
    state: 'model-serving',
    type: 'link',
    name: 'Model Serving',
    icon: 'developer_mode',
  },
  {
    state: 'model-validation',
    type: 'link',
    name: 'Model Validation',
    icon: 'av_timer',
  },
  /*8
  {
    state: 'runs',
    type: 'link',
    name: 'Runs',
    icon: 'directions_run',
  },
  */
];

@Injectable()
export class MenuItems {
  getMenuitem(): Menu[] {
    return MENU_ITEMS;
  }
}
