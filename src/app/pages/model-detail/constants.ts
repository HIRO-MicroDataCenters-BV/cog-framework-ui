import { ITabItem } from '../../shared/data-header/types';

export const MODEL_DETAIL_TABS = (id: string): ITabItem[] =>
  [
    {
      label: 'Model Info',
      link: ['/model-detail', id, 'info'],
    },
    {
      label: 'Model Files',
      link: ['/model-detail', id, 'files'],
    },
    {
      label: 'Model Datasets',
      link: ['/model-detail', id, 'datasets'],
    },
    {
      label: 'Validation Metrics',
      link: ['/model-detail', id, 'metrics'],
    },
    // {
    //   label: 'Model Pipeline',
    //   link: ['/model-detail', id, 'pipeline'],
    // },
  ] as const;
