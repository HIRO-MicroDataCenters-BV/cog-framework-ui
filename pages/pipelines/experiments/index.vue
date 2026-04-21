<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import { useApi } from '@/composables/api';
import CopyPaste from '~/components/app/CopyPaste.vue';
import RunStatusDots from '~/components/app/RunStatusDots.vue';
import ExperimentRunsPanel from '~/components/app/ExperimentRunsPanel.vue';
import { shortenUuid } from '~/utils';

const { t } = useI18n();
const dayjs = useDayjs();
const { getExperimentsListV2, getRunsByExperimentV2 } = useApi();
const { setPage } = useApp();

setPage({
  section: 'pipeline_experiments',
  description: t('description.pipeline_experiments'),
});

const tableRef = ref();

type RunSummary = {
  run_id: string;
  run_name: string;
  status: string;
  created_at: string | null;
  finished_at?: string | null;
  duration?: string;
};

type ExperimentRow = {
  experiment_id: string;
  experiment_name?: string;
  description?: string;
  namespace?: string;
  created_at?: string | null;
  storage_state?: string;
  last_runs?: RunSummary[];
};

/**
 * Wrapper that forwards AppTable params to the KFP experiments API, then
 * enriches each row with its most recent runs (mirroring the KFP dashboard's
 * "Last 5 runs" column).
 */
const getExperiments = async (params: Record<string, unknown> = {}) => {
  const res = await getExperimentsListV2(params);
  if (!res || !Array.isArray(res.data)) return res;

  const experiments = res.data as ExperimentRow[];

  const enriched = await Promise.all(
    experiments.map(async (exp) => {
      const last_runs = await getRunsByExperimentV2(exp.experiment_id, {
        limit: 5,
        namespace: exp.namespace || undefined,
      });
      return { ...exp, last_runs };
    }),
  );

  return { ...res, data: enriched };
};

const columns = [
  {
    id: 'experiment_name',
    size: 300,
    cell: ({ row }: { row: TableRowType }) => {
      const name =
        (row.getValue<string>('experiment_name') as string | undefined) ||
        row.getValue<string>('experiment_id');

      return h(
        'span',
        { class: 'block truncate max-w-[300px] font-medium' },
        name,
      );
    },
  },
  {
    id: 'experiment_id',
    accessorFn: (row) => row.experiment_id,
    size: 220,
    minSize: 200,
    maxSize: 280,
    cell: ({ row }: { row: TableRowType }) => {
      const experimentIdValue = String(row.original.experiment_id ?? '');
      if (!experimentIdValue) return '-';

      const shortenedId = shortenUuid(experimentIdValue);

      return h(
        CopyPaste,
        {
          hasCopy: true,
          copyText: experimentIdValue,
        },
        {
          default: () => shortenedId,
        },
      );
    },
  },
  {
    id: 'last_runs',
    accessorFn: (row: ExperimentRow) => row.last_runs,
    size: 180,
    enableSorting: false,
    cell: ({ row }: { row: TableRowType }) => {
      const runs = (row.original.last_runs as RunSummary[] | undefined) || [];
      return h(RunStatusDots, { runs });
    },
  },
  {
    id: 'created_at',
    size: 140,
    cell: ({ row }: { row: TableRowType }) => {
      const createdAt = row.getValue<string>('created_at');
      if (!createdAt) return '-';
      return h('div', { class: 'flex flex-col' }, [
        h('div', {}, dayjs(createdAt).format('DD-MMM-YYYY')),
        h(
          'div',
          { class: 'text-xs text-muted-foreground' },
          dayjs(createdAt).format('HH:mm:ss'),
        ),
      ]);
    },
  },
];
</script>

<template>
  <AppTable
    ref="tableRef"
    :columns="columns"
    :data-source="getExperiments"
    :has-stats="true"
    :has-filters="false"
    :selectable="false"
    :expandable="true"
  >
    <template #expanded="{ row }">
      <ExperimentRunsPanel
        :runs="row.last_runs || []"
        :experiment-id="row.experiment_id"
        :experiment-name="row.experiment_name"
      />
    </template>
  </AppTable>
</template>
