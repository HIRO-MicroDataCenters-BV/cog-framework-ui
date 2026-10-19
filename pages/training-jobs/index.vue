<script setup lang="ts">
/**
 * Training jobs list.
 *
 * Lists the caller's Kubeflow training jobs (`GET /cogapi/training-jobs`),
 * polls while any job is still in flight, and offers the create dialog, a
 * log sheet, a link to the registered model and delete. The backend syncs
 * each in-flight job's state from the cluster on every list read, so the
 * poll is what keeps the table current.
 */
import { useIntervalFn } from '@vueuse/core';
import type { TableRowType } from '@/types/row.types';
import DropdownAction from '@/components/app/menu/Actions.vue';
import { useApi } from '@/composables/api';
import CopyPaste from '~/components/app/CopyPaste.vue';
import TrainingJobCreate from '~/components/app/dialog/TrainingJobCreate.vue';
import TrainingJobLogsSheet from '~/components/app/TrainingJobLogsSheet.vue';
import { Button } from '~/components/ui/button';
import { shortenUuid } from '~/utils';
import {
  isTrainingJobInFlight,
  trainingJobStateClass,
} from '~/utils/trainingJobStates';
import type { TrainingJob } from '~/types/api.types';

const { t } = useI18n();
const dayjs = useDayjs();
const router = useRouter();
const { getTrainingJobs, deleteTrainingJob } = useApi();
const { setPage } = useApp();

setPage({
  section: 'training-jobs',
  description: t('description.training_jobs'),
});

const tableRef = ref();
const dialogOpen = ref(false);
const logsOpen = ref(false);
const logsJob = ref<TrainingJob | null>(null);

/** How often the list is re-read while it shows an unfinished job. */
const JOB_POLL_MS = 5000;
const hasUnfinishedJobs = ref(false);

const listJobs = async (params: Record<string, unknown> = {}) => {
  const { silent: _silent, ...query } = params;
  const result = await getTrainingJobs(query);
  // request() returns null on a transient failure; AppTable keeps the rows
  // it has, so the poll must keep running too — only a real jobs array may
  // change the flag.
  if (!result || !Array.isArray(result.data)) return result;
  const rows = result.data as TrainingJob[];
  hasUnfinishedJobs.value = rows.some((job) =>
    isTrainingJobInFlight(job.state),
  );
  // AppTable needs a pagination block to render rows; synthesise one when the
  // backend answered without it (e.g. a fixture).
  return {
    ...result,
    pagination: result.pagination ?? {
      total_items: rows.length,
      page: 1,
      limit: rows.length || 1,
    },
  };
};

const { pause: pausePolling, resume: resumePolling } = useIntervalFn(
  () => {
    void tableRef.value?.fetchData({ silent: true });
  },
  JOB_POLL_MS,
  { immediate: false },
);

watch(
  hasUnfinishedJobs,
  (unfinished) => {
    if (unfinished) resumePolling();
    else pausePolling();
  },
  { immediate: true },
);

const refresh = () => {
  void tableRef.value?.fetchData();
};

const handleCreated = () => {
  refresh();
};

const openLogs = (job: TrainingJob) => {
  logsJob.value = job;
  logsOpen.value = true;
};

const handleDelete = async (job: TrainingJob) => {
  await deleteTrainingJob(job.id);
  refresh();
};

/**
 * CogAPI serialises its timestamps as naive UTC (`2026-10-19T19:04:19`, no
 * zone). Parsing that as local time shifts every value by the viewer's
 * offset and inflates running durations by it, so mark it UTC first.
 */
const asUtc = (value: string) =>
  /(Z|[+-]\d\d:?\d\d)$/.test(value) ? dayjs(value) : dayjs(`${value}Z`);

const formatDuration = (job: TrainingJob) => {
  const start = job.started_at || job.created_at;
  if (!start) return '-';
  const end = job.finished_at ? asUtc(job.finished_at) : dayjs();
  const seconds = Math.max(0, end.diff(asUtc(start), 'second'));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const columns = [
  {
    id: 'name',
    size: 220,
    cell: ({ row }: { row: TableRowType }) => {
      const job = row.original as TrainingJob;
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'truncate font-medium', title: job.name }, job.name),
        h(
          'span',
          { class: 'text-xs text-muted-foreground font-mono' },
          job.job_name,
        ),
      ]);
    },
  },
  {
    id: 'algorithm_id',
    size: 220,
    cell: ({ row }: { row: TableRowType }) => {
      const job = row.original as TrainingJob;
      const fwClass =
        job.framework === 'pytorch'
          ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-100'
          : 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100';
      return h('div', { class: 'flex flex-col gap-1 min-w-0' }, [
        h('span', { class: 'truncate text-sm' }, job.algorithm_id),
        h(
          'span',
          {
            class: `inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${fwClass}`,
          },
          job.framework,
        ),
      ]);
    },
  },
  {
    id: 'dataset_id',
    size: 150,
    cell: ({ row }: { row: TableRowType }) => {
      const job = row.original as TrainingJob;
      if (!job.dataset_id) return '-';
      return h(
        CopyPaste,
        { hasCopy: true, copyText: job.dataset_id },
        {
          default: () =>
            h(
              resolveComponent('NuxtLink'),
              { to: `/datasets/${job.dataset_id}` },
              () => shortenUuid(job.dataset_id as string),
            ),
        },
      );
    },
  },
  {
    id: 'state',
    size: 120,
    cell: ({ row }: { row: TableRowType }) => {
      const job = row.original as TrainingJob;
      const label =
        job.state.charAt(0).toUpperCase() + job.state.slice(1).toLowerCase();
      return h(
        'span',
        {
          class: `inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${trainingJobStateClass(job.state)}`,
          title: job.message || '',
          'data-testid': 'job-state',
        },
        label,
      );
    },
  },
  {
    id: 'created_at',
    size: 115,
    cell: ({ row }: { row: TableRowType }) => {
      const createdAt = (row.original as TrainingJob).created_at;
      if (!createdAt) return '-';
      const created = asUtc(createdAt);
      return h('div', { class: 'flex flex-col' }, [
        h('div', {}, created.format('DD-MMM-YYYY')),
        h(
          'div',
          { class: 'text-xs text-muted-foreground' },
          created.format('HH:mm:ss'),
        ),
      ]);
    },
  },
  {
    id: 'duration',
    size: 100,
    cell: ({ row }: { row: TableRowType }) =>
      formatDuration(row.original as TrainingJob),
  },
  {
    id: 'model_id',
    size: 150,
    cell: ({ row }: { row: TableRowType }) => {
      const job = row.original as TrainingJob;
      if (!job.model_id) return '-';
      return h(
        resolveComponent('NuxtLink'),
        {
          to: `/models/${job.model_id}`,
          class: 'text-primary underline-offset-2 hover:underline',
          'data-testid': 'model-link',
        },
        () => shortenUuid(job.model_id as string),
      );
    },
  },
  {
    id: 'actions',
    size: 80,
    enableHiding: false,
    cell: ({ row }: { row: TableRowType }) => {
      const job = row.original as TrainingJob;
      const items = [
        {
          key: 'view_logs',
          label: t('action.view_logs'),
          icon: 'lucide:scroll-text',
          action: () => openLogs(job),
        },
        ...(job.model_id
          ? [
              {
                key: 'open_model',
                label: t('action.open_model'),
                icon: 'lucide:bot',
                action: () => router.push(`/models/${job.model_id}`),
              },
            ]
          : []),
        {
          key: 'delete_training_job',
          label: t('action.delete_training_job'),
          icon: 'lucide:trash-2',
          hasConfirmation: true,
          action: () => handleDelete(job),
        },
      ];
      return h(DropdownAction, {
        title: job.name,
        id: job.id,
        items,
        menuTitle: t('title.training_job_actions'),
      });
    },
  },
];
</script>

<template>
  <div class="flex flex-col h-full">
    <AppTable
      ref="tableRef"
      :columns="columns"
      :data-source="listJobs"
      :has-stats="false"
      :has-filters="false"
      :selectable="false"
    >
      <template #header-actions>
        <Button data-testid="new-training-job" @click="dialogOpen = true">
          <Icon name="lucide:plus" class="size-4 mr-2" />
          {{ t('action.add_training_job') }}
        </Button>
      </template>
    </AppTable>

    <TrainingJobCreate v-model:open="dialogOpen" @created="handleCreated" />
    <TrainingJobLogsSheet v-model:open="logsOpen" :job="logsJob" />
  </div>
</template>
