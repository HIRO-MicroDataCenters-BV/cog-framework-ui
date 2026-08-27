import type { EntitlementTier } from '~/types/api.types';

export const uselistMenus = () => {
  const { t } = useI18n();
  return useState('listMenus', () => {
    return {
      main: [
        {
          key: 'dashboard',
          title: 'Dashboard',
          url: 'dashboard',
          icon: 'lucide:layout-dashboard',
          items: [],
          isActive: false,
          // Premium feature: only visible from the admin tier upwards
          minTier: 'admin' as EntitlementTier,
        },
        {
          key: 'datasets',
          title: t('menu.datasets'),
          url: 'datasets',
          icon: 'lucide:table-2',
          items: [],
          isActive: false,
          minTier: 'free' as EntitlementTier,
        },
        {
          key: 'models',
          title: t('menu.models'),
          url: 'models',
          icon: 'lucide:bot',
          items: [],
          isActive: false,
          minTier: 'free' as EntitlementTier,
        },
        {
          key: 'model-serving',
          title: t('menu.model_serving'),
          url: 'model-serving',
          icon: 'lucide:server',
          items: [],
          isActive: false,
          minTier: 'free' as EntitlementTier,
        },
        {
          key: 'fine-tune',
          title: t('menu.fine_tune'),
          url: 'fine-tune',
          icon: 'lucide:sliders-horizontal',
          items: [],
          isActive: false,
          minTier: 'free' as EntitlementTier,
          // Entry stays visible below `featureTier`, but shows a lock and the
          // page serves the upgrade panel instead of the feature.
          featureTier: 'enterprise' as EntitlementTier,
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
              icon: 'lucide:gauge',
            },
            {
              key: 'pipelines-experiments',
              title: t('menu.pipeline_experiments') ?? 'Experiments',
              url: 'pipelines/experiments',
              icon: 'lucide:flask-conical',
            },
            {
              key: 'pipelines-builder',
              title: 'Builder',
              url: 'pipelines/builder',
              icon: 'lucide:workflow',
            },
          ],
          isActive: false,
          minTier: 'free' as EntitlementTier,
        },
        {
          key: 'flowise',
          title: 'GenAI',
          url: 'flowise',
          icon: 'lucide:sparkles',
          items: [],
          isActive: false,
          minTier: 'free' as EntitlementTier,
          featureTier: 'enterprise' as EntitlementTier,
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
