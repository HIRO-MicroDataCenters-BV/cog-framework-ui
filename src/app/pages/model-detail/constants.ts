import { ITabItem } from '../../shared/data-header/types';

export const MODEL_DETAIL_TABS = (id: string): ITabItem[] =>
  [
    {
      label: 'label.model_info',
      link: ['/model', id, 'info'],
    },
    {
      label: 'label.model_files',
      link: ['/model', id, 'files'],
    },
    {
      label: 'label.model_datasets',
      link: ['/model', id, 'datasets'],
    },
    {
      label: 'label.model_validation',
      link: ['/model', id, 'validation'],
    },
    // {
    //   label: 'Model Pipeline',
    //   link: ['/model', id, 'pipeline'],
    // },
  ] as const;
