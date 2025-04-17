<script setup lang="ts">
const dayjs = useDayjs();
const { getModels } = useApi();

const title = 'models';

const columns = [
  {
    id: 'id',
    cell: ({ row }) => row.getValue('id'),
  },
  {
    id: 'name',
    cell: ({ row }) => row.getValue('name'),
  },
  {
    id: 'version',
    cell: ({ row }) => row.getValue('version'),
  },
  {
    id: 'type',
    cell: ({ row }) => row.getValue('type'),
  },
  {
    id: 'description',
    cell: ({ row }) => row.getValue('description'),
  },
  {
    id: 'last_modified_time',
    cell: ({ row }) =>
      dayjs(row.getValue('last_modified_time')).format('DD.MM.YYYY'),
  },
  {
    id: 'register_date',
    cell: ({ row }) =>
      dayjs(row.getValue('register_date')).format('DD.MM.YYYY'),
  },
];
</script>

<template>
  <AppTable :columns="columns" :data-source="getModels" :title="title" />
</template>
