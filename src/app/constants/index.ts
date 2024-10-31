import { SearcherOption } from '../components/app-searcher/app-searcher.component';
import { ButtonItem } from '../model/General';

export const PAGE_SIZE_OPTIONS = [5, 10, 20];

export const DEF_SEARCH_PARAMS: SearcherOption[] = [
  { key: 'name', label: 'Name', inputType: 'text' },
  { key: 'id', label: 'Id', inputType: 'number' },
];

export const DEF_DIALOG_ACTIONS: ButtonItem[] = [
  {
    varient: 'secondary',
    type: 'cancel',
    ui: 'basic',
  },
  {
    varient: 'primary',
    type: 'ok',
    ui: 'flat',
  },
];

export const PIPELINE_ICONS_KEYS: string[] = [
  'download-data',
  'getmodel',
  'preprocess',
  'serving',
  'training',
];

export const RESPONSE_CODE = {
  NOT_FOUND: 404,
};
