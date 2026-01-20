<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import { useApi } from '@/composables/api';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';
import { Badge } from '~/components/ui/badge';
import DropdownAction from '@/components/app/menu/Actions.vue';

const dayjs = useDayjs();
const { getModels, deleteModel } = useApi();
const { setPage, page } = useApp();
const tableRef = ref();

setPage({
  section: 'models',
});

const baseUrl = page.value.section;
const config = useRuntimeConfig();
const urlOrigin = window.location.origin;

const columns = [
  {
    id: 'name',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'a',
        {
          href: `${urlOrigin}${config.app.baseURL}${baseUrl}/${row.getValue('id')}`,
        },
        row.getValue('name'),
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
    id: 'version',
    cell: ({ row }: { row: TableRowType }) => {
      const value = row.getValue<string>('version').toString();
      return h(
        Badge,
        {
          value,
        },
        () => [],
      );
    },
  },
  {
    id: 'type',
    cell: ({ row }: { row: TableRowType }) => {
      const value = row.getValue<string>('type');
      return h(
        Badge,
        {
          type: 'status',
          value,
        },
        () => [],
      );
    },
  },
  {
    id: 'register_user_id',
    cell: ({ row }: { row: TableRowType }) => row.getValue('register_user_id'),
  },
  {
    id: 'register_date',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'span',
        {
          class: 'font-mono',
          title: dayjs(row.getValue<string>('register_date')).format(
            'DD MMM YYYY HH:mm:ss',
          ),
        },
        dayjs(row.getValue<string>('register_date')).format('DD.MM.YYYY'),
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
        dayjs(row.getValue<string>('last_modified_time')).format('DD.MM.YYYY'),
      ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }: { row: TableRowType }) => {
      const id = row.getValue<string>('id');

      return h(DropdownAction, {
        title: row.getValue('name') as string,
        id,
        items: [
          {
            key: 'delete_model',
            label: 'delete_model',
            hasConfirmation: true,
            action: async () => {
              await deleteModel(id);
              tableRef.value.fetchData();
            },
          },
        ],
      });
    },
  },
];

const tabs = uselistTabs().value.model_management;
</script>

<template>
  <AppTable
    ref="tableRef"
    :columns="columns"
    :data-source="getModels"
    :tabs="tabs"
    :sortable-columns="['last_modified_time', 'register_date']"
    class="flex-grow"
  />
</template>
