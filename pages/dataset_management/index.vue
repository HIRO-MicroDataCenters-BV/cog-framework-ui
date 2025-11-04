<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';

import DropdownAction from '@/components/app/menu/Actions.vue';
import { useApi } from '@/composables/api';
import { Badge } from '~/components/ui/badge';

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
    cell: ({ row }: { row: TableRowType }) => {
      const value = parseInt(row.getValue<string>('id'));
      return h(
        Badge,
        {
          value: 'id',
          type: 'type',
        },
        `#${value}`,
      );
    },
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
    id: 'data_source_type',
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
    cell: ({ row }: { row: TableRowType }) => row.getValue('user_id'),
  },
  {
    id: 'register_date_time',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'span',
        {
          class: 'font-mono',
          title: dayjs(row.getValue<string>('register_date_time')).format(
            'DD MMM YYYY HH:mm:ss',
          ),
        },
        dayjs(row.getValue<string>('register_date_time')).format('DD MMM YYYY'),
      ),
  },
  {
    id: 'last_modified_time',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'span',
        {
          class: 'font-mono',
          title: dayjs(row.getValue<string>('last_modified_time')).format(
            'DD MMM YYYY HH:mm:ss',
          ),
        },
        dayjs(row.getValue<string>('last_modified_time')).format('DD MMM YYYY'),
      ),
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
    :sortable-columns="['last_modified_time']"
    class="flex-grow"
  />
</template>
