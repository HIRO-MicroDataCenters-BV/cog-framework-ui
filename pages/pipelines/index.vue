<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';

const { t } = useI18n();

const dayjs = useDayjs();
const { getAllPipelineRuns } = useApi();
const { setPage, page } = useApp();

setPage({
  section: 'pipelines',
  description: t('description.pipelines'),
});

const baseUrl = page.value.section;

const columns = [
  {
    id: 'run_id',
    cell: ({ row }: { row: TableRowType }) => row.getValue('run_id'),
  },
  {
    id: 'run_name',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'a',
        { href: `${baseUrl}/${row.getValue('run_id')}` },
        row.getValue('run_name') || row.getValue('run_id'),
      ),
  },
  {
    id: 'created_on',
    cell: ({ row }: { row: TableRowType }) => {
      const startTime = row.getValue<string>('start_time');
      return startTime ? dayjs(startTime).format('DD.MM.YYYY HH:mm') : '-';
    },
  },
  {
    id: 'started_on',
    cell: ({ row }: { row: TableRowType }) => {
      const startTime = row.getValue<string>('start_time');
      return startTime ? dayjs(startTime).format('DD.MM.YYYY HH:mm') : '-';
    },
  },
  {
    id: 'status',
    cell: ({ row }: { row: TableRowType }) => {
      const status = row.getValue<string>('status');
      return h(Badge, {
        status: status?.toLowerCase() || 'pending',
      });
    },
  },
  {
    id: 'duration',
    cell: ({ row }: { row: TableRowType }) => {
      const duration = row.getValue<string>('duration');
      const startTime = row.getValue<string>('start_time');

      if (duration) {
        return duration;
      }

      return calculateDuration(startTime);
    },
  },
  {
    id: 'created_by',
    cell: ({ row }: { row: TableRowType }) => {
      return row.getValue('experiment_id') || '-';
    },
  },
];

// Data source function for pipeline runs
const dataSource = async () => {
  try {
    const response = await getAllPipelineRuns();

    if (response && response.data) {
      if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        return [response.data];
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch pipeline runs:', error);
    return [];
  }
};

const tabs = [
  {
    id: 'all',
    label: 'All Runs',
    count: 0,
  },
];
</script>

<template>
  <AppTable
    :columns="columns"
    :data-source="dataSource"
    :tabs="tabs"
    :has-stats="false"
  />
</template>
