<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';

import DropdownAction from '@/components/app/menu/Actions.vue';
import PreviewDialog from '@/components/app/dialog/Preview.vue';
import { useApi } from '@/composables/api';
import { Badge } from '~/components/ui/badge';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';

const dayjs = useDayjs();
const { setPage, page } = useApp();

const tableRef = ref();

const { getDatasets } = useApi();
const { previewState } = useDatasetActions();

setPage({
  section: 'datasets',
});

const baseUrl = page.value.section;
const config = useRuntimeConfig();
const urlOrigin = window.location.origin;

const tabs = uselistTabs().value.dataset_management;

const columns = [
  {
    id: 'dataset_name',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'a',
        {
          href: `${urlOrigin}${config.app.baseURL}${baseUrl}/${row.getValue('id')}`,
        },
        row.getValue('dataset_name'),
      ),
  },
  {
    id: 'id',
    accessorFn: (row) => row.id,
    size: 180,
    minSize: 180,
    maxSize: 180,
    cell: ({ row }: { row: TableRowType }) => {
      const idValue = String(row.original.id);
      const shortenedId = shortenUuid(idValue);
      return h(
        CopyPaste,
        {
          hasCopy: true,
          copyText: idValue,
        },
        {
          default: () => shortenedId,
        },
      );
    },
  },
  {
    id: 'data_source_type',
    size: 150,
    cell: ({ row }: { row: TableRowType }) => {
      const value = parseInt(row.getValue<string>('data_source_type'));
      return h(
        Badge,
        {
          value,
          type: 'type',
        },
        () => [],
      );
    },
  },
  {
    id: 'user_id',
    size: 200,
    cell: ({ row }: { row: TableRowType }) => row.getValue('user_id'),
  },
  {
    id: 'register_date_time',
    size: 140,
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'span',
        {
          title: dayjs(row.getValue<string>('register_date_time')).format(
            'DD MMM YYYY HH:mm:ss',
          ),
        },
        dayjs(row.getValue<string>('register_date_time')).format('DD-MMM-YYYY'),
      ),
  },
  {
    id: 'last_modified_time',
    size: 140,
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'span',
        {
          title: dayjs(row.getValue<string>('last_modified_time')).format(
            'DD MMM YYYY HH:mm:ss',
          ),
        },
        dayjs(row.getValue<string>('last_modified_time')).format('DD-MMM-YYYY'),
      ),
  },
  {
    id: 'actions',
    size: 80,
    enableHiding: false,
    cell: ({ row }: { row: TableRowType }) => {
      const { getDatasetActions } = useDatasetActions();

      const id = row.getValue<string>('id');
      const datasetName = row.getValue<string>('dataset_name');
      const dataSourceType = parseInt(row.getValue<string>('data_source_type'));

      const items = getDatasetActions(id, datasetName, dataSourceType, () =>
        tableRef.value.fetchData(),
      );

      return h(DropdownAction, {
        title: datasetName,
        id,
        items,
      });
    },
  },
];
</script>

<template>
  <div>
    <AppTable
      ref="tableRef"
      :columns="columns"
      :data-source="getDatasets"
      :tabs="tabs"
      :sortable-columns="['last_modified_time']"
      :filterable-columns="['data_source_type']"
      class="grow"
    />

    <!-- Preview Dialog -->
    <PreviewDialog
      v-model:open="previewState.open"
      :title="previewState.title"
      :data="previewState.data"
      :type="previewState.type"
    />
  </div>
</template>
