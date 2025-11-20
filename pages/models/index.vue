<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import { useApi } from '@/composables/api';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';
import { Badge } from '~/components/ui/badge';

const dayjs = useDayjs();
const { getModels } = useApi();
const { setPage, page } = useApp();

setPage({
  section: 'models',
});

const baseUrl = page.value.section;

const columns = [
  /*
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
  */
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
];

const tabs = uselistTabs().value.model_management;
</script>

<template>
  <AppTable
    :columns="columns"
    :data-source="getModels"
    :tabs="tabs"
    :sortable-columns="['last_modified_time', 'register_date']"
    class="flex-grow"
  />
</template>
