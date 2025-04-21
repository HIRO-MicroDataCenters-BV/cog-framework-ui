<script setup lang="ts">
import type { TableRowType } from '~/types/row.types';

const dayjs = useDayjs();
const { fetchDatasets } = useApi();

const title = 'datasets';

const columns = [
  {
    id: 'id',
    cell: ({ row }: { row: TableRowType }) => row.getValue('id'),
  },
  {
    id: 'dataset_name',
    cell: ({ row }: { row: TableRowType }) => row.getValue('dataset_name'),
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
