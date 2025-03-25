export const uselistTabs = () => {
  const { t } = useI18n();
  return useState('listTabs', () => {
    return {
      dataset_management: [
        {
          key: 'all',
          value: 'all',
          title: t('tab.all'),
          url: '/all',
          icon: null,
        },
        {
          key: 'files',
          value: 'files',
          title: t('tab.files'),
          url: '/file',
          icon: 'lucide:table',
        },
        {
          key: 'tables',
          value: 'tables',
          title: t('tab.tables'),
          url: '/tables',
          icon: 'lucide:database',
        },
        {
          key: 'data_stream',
          value: 'data_stream',
          title: t('tab.streams'),
          url: '/data-stream',
          icon: 'lucide:circle-dot',
        },
      ],
    };
  });
};
