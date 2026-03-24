export const uselistMenus = () => {
  const { t } = useI18n();
  return useState('listMenus', () => {
    return {
      main: [
        {
          key: 'datasets',
          title: t('menu.datasets'),
          url: 'datasets',
          icon: 'lucide:table-2',
          items: [],
          isActive: false,
        },
        {
          key: 'models',
          title: t('menu.models'),
          url: 'models',
          icon: 'lucide:bot',
          items: [],
          isActive: false,
        },
        {
          key: 'model-serving',
          title: t('menu.model_serving'),
          url: 'model-serving',
          icon: 'lucide:server',
          items: [],
          isActive: false,
        },
        {
          key: 'pipelines',
          title: t('menu.pipelines'),
          url: 'pipelines',
          icon: 'lucide:route',
          items: [
            {
              key: 'pipelines-runs',
              title: t('menu.pipeline_runs') ?? 'Runs',
              url: 'pipelines/run',
            },
            {
              key: 'pipelines-builder',
              title: 'Builder',
              url: 'pipelines/builder',
            },
          ],
          isActive: false,
        },
        {
          key: 'flowise',
          title: 'Flowise',
          url: 'flowise',
          icon: 'lucide:sparkles',
          items: [],
          isActive: false,
        },
      ],
      footer: [],
      user: [
        {
          key: 'profile',
          title: t('action.profile'),
          url: '#',
          icon: 'lucide:user',
        },
        {
          key: 'settings',
          title: t('menu.settings'),
          url: '#',
          icon: 'lucide:settings',
        },
        {
          key: 'notifications',
          title: t('action.notifications'),
          url: '#',
          icon: 'lucide:bell',
        },
        {
          key: 'help',
          title: t('action.help'),
          url: '#',
          icon: 'lucide:help-circle',
        },
        {
          key: 'documentation',
          title: t('menu.documentation'),
          url: '#',
          icon: 'lucide:book-open',
        },
        {
          key: 'logout',
          title: t('action.logout'),
          url: '#',
          icon: 'lucide:log-out',
        },
      ],
    };
  });
};
