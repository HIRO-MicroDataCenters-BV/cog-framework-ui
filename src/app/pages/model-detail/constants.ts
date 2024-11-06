import { ITabItem } from '../../shared/data-header/types';

export const MODEL_DETAIL_TABS = (id: string): ITabItem[] =>
  [
    {
      label: 'label.model_info',
      link: ['/model-detail', id, 'info'],
    },
    {
      label: 'label.model_files',
      link: ['/model-detail', id, 'files'],
    },
    {
      label: 'label.model_datasets',
      link: ['/model-detail', id, 'datasets'],
    },
    {
      label: 'label.model_validation',
      link: ['/model-detail', id, 'validation'],
    },
    // {
    //   label: 'Model Pipeline',
    //   link: ['/model-detail', id, 'pipeline'],
    // },
  ] as const;
