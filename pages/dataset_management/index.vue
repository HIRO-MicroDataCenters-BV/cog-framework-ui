<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';

import DropdownAction from '@/components/app/menu/Actions.vue';
import { useApi } from '@/composables/api';

const dayjs = useDayjs();
const { setPage, page } = useApp();
const { getDatasets } = useApi();

const tableRef = ref();

const {
  deleteDatasetFile,
  deleteDatasetBroker,
  deleteDatasetTopic,
  deleteDatasetMessage,
} = useApi();

setPage({
  section: 'dataset_management',
});

const baseUrl = page.value.section;

const tabs = uselistTabs().value.dataset_management;

const columns = [
  {
    id: 'id',
    cell: ({ row }: { row: TableRowType }) => row.getValue('id'),
  },
  {
    id: 'dataset_name',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'a',
        { href: `${baseUrl}/${row.getValue('id')}` },
        row.getValue('dataset_name'),
      ),
  },
  {
    id: 'description',
    cell: ({ row }: { row: TableRowType }) => row.getValue('description'),
  },
  {
    id: 'data_source_type',
    cell: ({ row }: { row: TableRowType }) => row.getValue('data_source_type'),
  },
  {
    id: 'train_and_inference_type',
    cell: ({ row }: { row: TableRowType }) =>
      row.getValue('train_and_inference_type'),
  },
  {
    id: 'created_at',
    cell: ({ row }: { row: TableRowType }) =>
      dayjs(row.getValue<string>('created_at')).format('DD.MM.YYYY'),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }: { row: TableRowType }) => {
      const id = parseInt(row.getValue('id'));

      return h(DropdownAction, {
        title: row.getValue('dataset_name') as string,
        id,
        items: [
          {
            key: 'delete_file',
            label: 'delete_file',
            hasConfirmation: true,
            action: async () => {
              await deleteDatasetFile(id);
              tableRef.value.fetchData();
            },
          },
          {
            key: 'delete_broker',
            label: 'delete_broker',
            hasConfirmation: true,
            action: async () => {
              await deleteDatasetBroker(id);
              tableRef.value.fetchData();
            },
          },
          {
            key: 'delete_topic',
            label: 'delete_topic',
            hasConfirmation: true,
            action: async () => {
              await deleteDatasetTopic(id);
              tableRef.value.fetchData();
            },
          },
          {
            key: 'delete_message',
            label: 'delete_message',
            hasConfirmation: true,
            action: async () => {
              await deleteDatasetMessage(id);
              tableRef.value.fetchData();
            },
          },
        ],
      });
    },
  },
];
</script>

<template>
  <AppTable
    ref="tableRef"
    :columns="columns"
    :data-source="getDatasets"
    :tabs="tabs"
    class="flex-grow"
  />
</template>
