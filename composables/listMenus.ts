export const uselistMenus = () => {
  const { t } = useI18n();
  return useState('listMenus', () => {
    return {
      main: [
        {
          key: 'dataset_management',
          title: t('menu.datasets'),
          url: 'dataset_management',
          icon: 'lucide:table-2',
          items: [],
          isActive: false,
        },
        {
          key: 'pipelines',
          title: t('menu.pipelines'),
          url: 'pipelines',
          icon: 'lucide:route',
          items: [],
          isActive: false,
        },
        {
          key: 'model_management',
          title: t('menu.model_management'),
          url: 'model_management',
          icon: 'lucide:package',
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
