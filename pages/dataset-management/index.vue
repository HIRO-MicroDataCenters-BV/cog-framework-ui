<script setup lang="ts">
import type { TableRowType } from '~/types/row.types';

const dayjs = useDayjs();
const { fetchDatasets } = useApi();

const title = 'datasets';

const columns = [
  {
    id: 'dataset_id',
    cell: ({ row }: { row: TableRowType }) => row.getValue('dataset_id'),
  },
  {
    id: 'name',
    cell: ({ row }: { row: TableRowType }) => row.getValue('name'),
  },
  {
    id: 'dataset_type',
    cell: ({ row }: { row: TableRowType }) => row.getValue('dataset_type'),
  },
  {
    id: 'created_at',
    cell: ({ row }: { row: TableRowType }) =>
      dayjs(row.getValue<string>('created_at')).format('DD.MM.YYYY'),
  },
];
</script>

<template>
  <AppTable
    :columns="columns"
    :data-source="fetchDatasets"
    :title="title"
    class="flex-grow"
  />
</template>
