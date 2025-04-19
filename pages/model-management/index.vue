<script setup lang="ts">
import type { TableRowType } from '~/types/row.types';

const dayjs = useDayjs();
const { getModels } = useApi();

const title = 'models';

const columns = [
  {
    id: 'id',
    cell: ({ row }: { row: TableRowType }) => row.getValue('id'),
  },
  {
    id: 'name',
    cell: ({ row }: { row: TableRowType }) => row.getValue('name'),
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
</script>

<template>
  <AppTable :columns="columns" :data-source="getModels" :title="title" />
</template>
