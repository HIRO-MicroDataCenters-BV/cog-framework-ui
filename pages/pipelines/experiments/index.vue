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

// Active vs Archived experiments tab — mirrors the pattern used on the
// pipeline runs list page.
const activeTab = ref<'active' | 'archived'>('active');

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
 * Wrapper that forwards AppTable params to the KFP experiments API (scoped
 * to the current Active/Archived tab via `storage_state`), then enriches
 * each row with its most recent runs (mirroring the KFP dashboard's
 * "Last 5 runs" column).
 */
const getExperiments = async (params: Record<string, unknown> = {}) => {
  const storageState =
    activeTab.value === 'active' ? 'NOT_ARCHIVED' : 'ARCHIVED';

  const res = await getExperimentsListV2({
    ...params,
    storage_state: storageState,
  });
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

watch(activeTab, () => {
  if (tableRef.value) {
    // Collapse any rows left open from the previous tab; otherwise TanStack
    // Table keeps the expanded state keyed by row index and an unrelated
    // experiment in the other tab inherits the open state.
    tableRef.value.resetExpanded?.();
    void tableRef.value.fetchData();
  }
});

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
    <template #header-actions>
      <!-- Segmented Active/Archived control (matches the runs list page). -->
      <div
        class="relative inline-flex h-9 shrink-0 items-stretch gap-0.5 rounded-lg bg-muted p-0.5"
      >
        <div
          :class="[
            'pointer-events-none absolute top-0.5 bottom-0.5 rounded-md bg-background shadow-sm transition-[left] duration-300 ease-in-out',
            activeTab === 'active' ? 'left-0.5' : 'left-(--seg-archived-left)',
          ]"
          :style="{
            width: 'calc((100% - 0.625rem) / 2)',
            '--seg-archived-left':
              'calc(0.125rem + (100% - 0.625rem) / 2 + 0.125rem)',
          }"
        />

        <button
          type="button"
          :class="[
            'relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-200',
            activeTab === 'active'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="activeTab = 'active'"
        >
          <Icon
            name="lucide:folder-open-dot"
            :class="[
              'size-4 shrink-0 transition-colors duration-300',
              activeTab === 'active' ? 'text-blue-500' : '',
            ]"
          />
          <span>Active</span>
        </button>
        <button
          type="button"
          :class="[
            'relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-200',
            activeTab === 'archived'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="activeTab = 'archived'"
        >
          <Icon
            name="lucide:folder-archive"
            :class="[
              'size-4 shrink-0 transition-colors duration-300',
              activeTab === 'archived' ? 'text-orange-500' : '',
            ]"
          />
          <span>Archived</span>
        </button>
      </div>
    </template>

    <template #expanded="{ row }">
      <ExperimentRunsPanel
        :runs="row.last_runs || []"
        :experiment-id="row.experiment_id"
        :experiment-name="row.experiment_name"
      />
    </template>
  </AppTable>
</template>
