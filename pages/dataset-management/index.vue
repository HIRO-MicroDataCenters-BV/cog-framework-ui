<script setup lang="ts">
const { fetchDatasets } = useApi();

const columns = [
  {
    id: 'dataset_id',
    cell: ({ row }) => row.getValue('dataset_id'),
  },
  {
    id: 'name',
    cell: ({ row }) => row.getValue('name'),
  },
  {
    id: 'dataset_type',
    cell: ({ row }) => row.getValue('dataset_type'),
  },
  {
    id: 'created_at',
    cell: ({ row }) => dayjs(row.getValue('created_at')).format('DD.MM.YYYY'),
  },
];
</script>

<template>
  <div class="p-4">
    <AppTable :columns="columns" :data-source="fetchDatasets" />
  </div>
</template>
