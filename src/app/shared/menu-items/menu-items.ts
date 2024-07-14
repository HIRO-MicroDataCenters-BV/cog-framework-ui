import { Injectable } from "@angular/core";

export interface Menu {
  state: string;
  name: string;
  type: string;
  icon: string;
}

const MENUITEMS = [
  // { state: 'dashboard', name: 'Dashboard', type: 'link', icon: 'av_timer' },
  { state: "model", type: "link", name: "Model Management", icon: "crop_7_5" },
  {
    state: "dataset",
    type: "link",
    name: "Dataset Management",
    icon: "border_horizontal",
  },
  {
    state: "dataset1",
    type: "link",
    name: "Model Training",
    icon: "all_inclusive",
  },
  {
    state: "dataset2",
    type: "link",
    name: "Model Deployment",
    icon: "assistant",
  },
  {
    state: "dataset3",
    type: "link",
    name: "Model Serving",
    icon: "developer_mode",
  },
  {
    state: "model-validation",
    type: "link",
    name: "Model Validation",
    icon: "av_timer",
  },
];

@Injectable()
export class MenuItems {
  getMenuitem(): Menu[] {
    return MENUITEMS;
  }
}
