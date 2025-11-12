<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import { useApi } from '@/composables/api';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';

const dayjs = useDayjs();
const { getModels } = useApi();
const { setPage, page } = useApp();

setPage({
  section: 'model_management',
});

const baseUrl = page.value.section;

const columns = [
  {
    id: 'id',
    size: 180,
    minSize: 180,
    maxSize: 180,
    cell: ({ row }: { row: TableRowType }) => {
      const idValue = row.getValue<string>('id');
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
    id: 'name',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'a',
        { href: `${baseUrl}/${row.getValue('id')}` },
        row.getValue('name'),
      ),
  },
  {
    id: 'version',
    cell: ({ row }: { row: TableRowType }) => row.getValue('version'),
  },
  {
    id: 'type',
    cell: ({ row }: { row: TableRowType }) => row.getValue('type'),
  },
  {
    id: 'description',
    cell: ({ row }: { row: TableRowType }) => row.getValue('description'),
  },
  {
    id: 'last_modified_time',
    cell: ({ row }: { row: TableRowType }) =>
      dayjs(row.getValue<string>('last_modified_time')).format('DD.MM.YYYY'),
  },
  {
    id: 'register_date',
    cell: ({ row }: { row: TableRowType }) =>
      dayjs(row.getValue<string>('register_date')).format('DD.MM.YYYY'),
  },
];

const tabs = uselistTabs().value.model_management;
</script>

<template>
  <AppTable
    :columns="columns"
    :data-source="getModels"
    :tabs="tabs"
    class="flex-grow"
  />
</template>
