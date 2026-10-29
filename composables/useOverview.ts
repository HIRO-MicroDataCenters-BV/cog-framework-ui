import { useApi } from '@/composables/api';
import type { Overview } from '~/types/overview.types';
import type { PipelineTemplateSummary } from '~/types/template.types';
import { plural, toPercent } from '~/utils/overview';

export type OverviewKpiTone = 'up' | 'down' | 'neutral';

export interface OverviewKpi {
  key: string;
  label: string;
  value: number;
  suffix?: string;
  /** Page the tile opens; unset for stats with no page of their own. */
  to?: string;
  icon: string;
  color: string;
  error: boolean;
  hint: string;
  tone: OverviewKpiTone;
}

/**
 * Data for the Overview home page: `GET /overview` plus the example
 * pipelines, and the KPI tiles derived from them.
 */
export const useOverview = () => {
  const api = useApi();

  const overview = ref<Overview | null>(null);
  const examples = ref<PipelineTemplateSummary[]>([]);
  const loading = ref(true);
  const failed = ref(false);

  const refresh = async () => {
    loading.value = true;
    failed.value = false;
    try {
      const [overviewRes, examplesRes] = await Promise.all([
        api.getOverview() as Promise<{ data?: Overview } | null>,
        api.getTrainingBuilderTemplates() as Promise<{
          data?: PipelineTemplateSummary[];
        } | null>,
      ]);
      overview.value = overviewRes?.data ?? null;
      examples.value = examplesRes?.data ?? [];
      failed.value = !overview.value;
    } catch {
      failed.value = true;
    } finally {
      loading.value = false;
    }
  };

  /** A source the backend could not read; its section is null. */
  const isUnavailable = (source: string) =>
    failed.value || (overview.value?.unavailable.includes(source) ?? false);

  const subtitle = computed(() => {
    const o = overview.value;
    if (!o) return '';
    const parts = [o.namespace ? `${o.namespace} workspace` : 'workspace'];
    if (o.runs) parts.push(`${o.runs.running} running`);
    if (o.endpoints)
      parts.push(`${plural(o.endpoints.length, 'endpoint')} live`);
    return parts.join(' · ');
  });

  const kpis = computed<OverviewKpi[]>(() => {
    const o = overview.value;
    const runs = o?.runs;
    const gpu = o?.gpu;
    const delta = runs ? runs.this_week - runs.last_week : null;
    return [
      {
        key: 'runs',
        to: isUnavailable('runs') ? undefined : '/pipelines/run',
        label: 'Runs this week',
        value: runs?.this_week ?? 0,
        icon: 'lucide:route',
        color: 'text-orange-500',
        error: isUnavailable('runs'),
        hint:
          delta === null
            ? ''
            : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} vs last week`,
        tone: delta === null ? 'neutral' : delta >= 0 ? 'up' : 'down',
      },
      {
        key: 'success',
        label: 'Success rate',
        value: toPercent(runs?.success_rate) ?? 0,
        suffix: '%',
        icon: 'lucide:circle-check',
        color: 'text-green-500',
        error: isUnavailable('runs') || runs?.success_rate === null,
        hint: runs ? plural(runs.failed_this_week, 'failure') : '',
        tone: runs?.failed_this_week ? 'down' : 'neutral',
      },
      {
        key: 'models',
        to: '/models',
        label: 'Models',
        value: o?.assets.models_total ?? 0,
        icon: 'lucide:bot',
        color: 'text-blue-500',
        error: failed.value,
        hint: o ? `${o.assets.models_this_week} registered this week` : '',
        tone: 'neutral',
      },
      {
        key: 'datasets',
        to: '/datasets',
        label: 'Datasets',
        value: o?.assets.datasets_total ?? 0,
        icon: 'lucide:table-2',
        color: 'text-purple-500',
        error: failed.value,
        hint: o
          ? `across ${plural(o.assets.dataset_source_types, 'source type')}`
          : '',
        tone: 'neutral',
      },
      {
        key: 'endpoints',
        to: isUnavailable('endpoints') ? undefined : '/model-serving',
        label: 'Live endpoints',
        value: o?.endpoints?.length ?? 0,
        icon: 'lucide:server',
        color: 'text-green-500',
        error: isUnavailable('endpoints'),
        hint: o?.endpoints
          ? `${o.endpoints.filter((e) => e.status?.toLowerCase() === 'ready').length} ready`
          : '',
        tone: 'neutral',
      },
      {
        key: 'gpu',
        label: 'GPU in use',
        value: toPercent(gpu?.utilisation) ?? 0,
        suffix: '%',
        icon: 'lucide:cpu',
        color: 'text-amber-500',
        error: isUnavailable('gpu') || !gpu?.total,
        hint: gpu?.total ? `${gpu.idle} of ${gpu.total} idle` : '',
        tone: 'neutral',
      },
    ];
  });

  return {
    overview,
    examples,
    loading,
    failed,
    refresh,
    isUnavailable,
    subtitle,
    kpis,
  };
};
