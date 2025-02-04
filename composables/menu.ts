export const useMenu = () => {
  const { t } = useI18n()
  return useState('menu', () => {
    return {
      main: [
        {
          key: 'dataset_management',
          title: t('menu.dataset_management'),
          url: '/dataset-management',
          icon: "lucide:table-2",
          items: [
            {
              key: 'all',
              title: t('tab.all'),
              url: '/all',
            },
          ],
          isActive: false,
        },
        {
          key: 'training_builder',
          title: t('menu.training_builder'),
          url: '/training-builder',
          icon: "lucide:network",
          items: [
            {
              key: 'all',
              title: t('tab.all'),
              url: '/all',
            },
          ],
          isActive: false,
        },
        {
          key: 'runs',
          title: t('menu.runs'),
          url: '/runs',
          icon: "lucide:play",
          items: [
            {
              key: 'all',
              title: t('tab.all'),
              url: '/all',
            },
          ],
          isActive: false,
        },
        {
          key: 'model_management',
          title: t('menu.model_management'),
          url: '/model-management',
          icon: "lucide:package",
          items: [
            {
              key: 'all',
              title: t('tab.all'),
              url: '/all',
            },
          ],
          isActive: false,
        },
        {
          key: 'model_validation',
          title: t('menu.model_validation'),
          url: '/model-validation',
          icon: "lucide:package-check",
          items: [
            {
              key: 'all',
              title: t('tab.all'),
              url: '/all',
            },
          ],
          isActive: false,
        },
        {
          key: 'model_serving',
          title: t('menu.model_serving'),
          url: '/model-serving',
          icon: "lucide:server",
          items: [
            {
              key: 'all',
              title: t('tab.all'),
              url: '/all',
            },
          ],
          isActive: false,
        },
      ],
      footer: [
        {
          key: 'documentation',
          title: t('menu.documentation'),
          url: '#',
          icon: "lucide:book-open",
        },
        {
          key: 'support',
          title: t('menu.support'),
          url: '#',
          icon: "lucide:life-buoy",
        },
      ],
    }
  })
}
