<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import Badge from '@/components/ui/badge/Badge.vue';
import DropdownAction from '@/components/app/menu/Actions.vue';
import { useApi } from '@/composables/api';
import { usePipelineActions } from '@/composables/usePipelineActions';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';

const { t } = useI18n();

const dayjs = useDayjs();
const { getPipelineRunsList } = useApi();
const mock = useMock();
const { setPage, page } = useApp();

setPage({
  section: 'pipelines',
  description: t('description.pipelines'),
});

const baseUrl = page.value.section;
const config = useRuntimeConfig();
const urlOrigin = window.location.origin;

const { getPipelineActions } = usePipelineActions();
const tableRef = ref();

const columns = [
  {
    id: 'run_name',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'a',
        {
          href: `${urlOrigin}${config.app.baseURL}${baseUrl}/${row.getValue('run_id')}`,
        },
        row.getValue('run_name') || row.getValue('run_id'),
      ),
  },
  {
    id: 'run_id',
    accessorFn: (row) => row.run_id,
    size: 180,
    minSize: 180,
    maxSize: 180,
    cell: ({ row }: { row: TableRowType }) => {
      const runIdValue = String(row.original.run_id);
      const shortenedId = shortenUuid(runIdValue);
      return h(
        CopyPaste,
        {
          hasCopy: true,
          copyText: runIdValue,
        },
        {
          default: () =>
            h(
              'a',
              { href: `${urlOrigin}${baseUrl}/${runIdValue}` },
              shortenedId,
            ),
        },
      );
    },
  },
  {
    id: 'start_time',
    cell: ({ row }: { row: TableRowType }) => {
      const startedOn = row.getValue<string>('start_time');
      return startedOn ? dayjs(startedOn).format('DD.MM.YYYY HH:mm') : '-';
    },
  },
  {
    id: 'experiment_id',
    cell: ({ row }: { row: TableRowType }) => row.getValue('experiment_id'),
  },
  {
    id: 'status',
    size: 130,
    cell: ({ row }: { row: TableRowType }) => {
      const status = row.getValue<string>('status');
      return h(
        Badge,
        {
          value: status?.toLowerCase() || 'pending',
          type: 'status',
        },
        () => [],
      );
    },
  },
  {
    id: 'duration',
    size: 120,
    cell: ({ row }: { row: TableRowType }) => row.getValue('duration'),
  },
  {
    id: 'actions',
    size: 80,
    enableHiding: false,
    cell: ({ row }: { row: TableRowType }) => {
      const id = row.getValue<string>('run_id');
      const name =
        row.getValue<string>('run_name') || row.getValue<string>('run_id');

      const items = getPipelineActions(id, name, () => {
        if (tableRef.value) {
          tableRef.value.fetchData();
        }
      });

      return h(DropdownAction, {
        title: name,
        id,
        items,
        menuTitle: t('title.pipeline_actions'),
      });
    },
  },
];

const tabs = [
  {
    key: 'all',
    value: 'all',
    title: 'All Runs',
    url: '',
    icon: null,
  },
];
const data = mock.value.pipelineRuns;
const mockDataSource = (params = {}) => {
  return Promise.resolve({
    data: data,
    total: data.length,
    page: 1,
    pageSize: data.length,
  });
};
console.log(data);
</script>

<template>
  <AppTable
    ref="tableRef"
    :columns="columns"
    :data-source="getPipelineRunsList"
    :tabs="tabs"
    :has-stats="false"
    :has-filters="false"
    :selectable="false"
  />
</template>
