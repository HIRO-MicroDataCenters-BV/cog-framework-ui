<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import Badge from '@/components/ui/badge/Badge.vue';
import { useApiWithMock } from '@/composables/mock';

const { t } = useI18n();

const dayjs = useDayjs();
const { getAllPipelineRuns } = useApiWithMock();
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

      if (startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
      }
      return '-';
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
const dataSource = async (params = {}) => {
  try {
    const response = await getAllPipelineRuns();

    if (response && 'data' in response && response.data) {
      return {
        data: Array.isArray(response.data) ? response.data : [response.data],
        total: Array.isArray(response.data) ? response.data.length : 1,
        page: 1,
        pageSize: Array.isArray(response.data) ? response.data.length : 1,
      };
    }

    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
    };
  } catch (error) {
    console.error('Failed to fetch pipeline runs:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
    };
  }
};

const tabs = [
  {
    key: 'all',
    value: 'all',
    title: 'All Runs',
    url: '',
    icon: null,
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
