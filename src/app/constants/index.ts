import { SearcherOption } from '../components/app-searcher/app-searcher.component';

export const PAGE_SIZE_OPTIONS = [5, 10, 20];

export const DEF_SEARCH_PARAMS: SearcherOption[] = [
  { key: 'name', label: 'Name', inputType: 'text' },
  { key: 'id', label: 'Id', inputType: 'number' },
];

export const RESPONSE_CODE = {
  NOT_FOUND: 404,
};
