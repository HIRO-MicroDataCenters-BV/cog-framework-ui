export const useTab = () => {
  const { t } = useI18n()
  return useState('tab', () => {
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
          key: 'file',
          value: 'file',
          title: t('tab.file'),
          url: '/file',
          icon: 'lucide:table',
        },
        {
          key: 'database',
          value: 'database',
          title: t('tab.database'),
          url: '/database',
          icon: 'lucide:database',
        },
        {
          key: 'data_stream',
          value: 'data_stream',
          title: t('tab.data_stream'),
          url: '/data-stream',
          icon: 'lucide:circle-dot',
        },
      ],
    }
  })
}
