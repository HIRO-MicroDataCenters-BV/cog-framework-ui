<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import { useApi } from '@/composables/api';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { Badge } from '~/components/ui/badge';

const dayjs = useDayjs();
const { t } = useI18n();
const { getModelsServing } = useApi();
const { setPage } = useApp();

setPage({
  section: 'model-serving',
});

const columns = [
  {
    id: 'isvc_name',
    size: 180,
    cell: ({ row }: { row: TableRowType }) => row.getValue('isvc_name'),
  },
  {
    id: 'model_name',
    size: 140,
    cell: ({ row }: { row: TableRowType }) => {
      const name = row.getValue<string>('model_name');
      const version = row.original.model_version;
      if (!name) return h('span', { class: 'text-muted-foreground' }, '-');
      return h('div', { class: 'flex items-center gap-2 overflow-hidden' }, [
        h('span', { class: 'truncate' }, name),
        version ? h(Badge, { variant: 'secondary', class: 'shrink-0' }, () => `v${version}`) : null,
      ]);
    },
  },
  {
    id: 'served_model_url',
    size: 300,
    cell: ({ row }: { row: TableRowType }) => {
      const url = row.getValue<string>('served_model_url');
      return h(
        resolveComponent('TooltipProvider'),
        { delayDuration: 300 },
        () =>
          h(resolveComponent('Tooltip'), null, {
            default: () => [
              h(resolveComponent('TooltipTrigger'), { asChild: true }, () =>
                h(
                  CopyPaste,
                  { hasCopy: true, copyText: url },
                  {
                    default: () =>
                      h('span', {
                        class: 'truncate block max-w-[280px] text-xs',
                      }, url),
                  },
                ),
              ),
              h(resolveComponent('TooltipContent'), null, () => url),
            ],
          }),
      );
    },
  },
  {
    id: 'status',
    size: 100,
    cell: ({ row }: { row: TableRowType }) => {
      const status = row.getValue<string>('status');
      const statusClasses: Record<string, string> = {
        ready: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100',
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100',
        failed: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100',
      };
      const classes = statusClasses[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100';
      return h('span', {
        class: `inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${classes}`,
      }, status);
    },
  },
  {
    id: 'traffic_percentage',
    size: 80,
    cell: ({ row }: { row: TableRowType }) => {
      const traffic = row.getValue<number>('traffic_percentage');
      return h('span', {}, `${traffic}%`);
    },
  },
  {
    id: 'creation_timestamp',
    size: 115,
    cell: ({ row }: { row: TableRowType }) => {
      const dateTime = row.getValue<string>('creation_timestamp');
      return h('div', { class: 'flex flex-col' }, [
        h('div', {}, dayjs(dateTime).format('DD-MMM-YYYY')),
        h('div', { class: 'text-xs text-muted-foreground' }, dayjs(dateTime).format('HH:mm:ss')),
      ]);
    },
  },
  {
    id: 'age',
    size: 120,
    cell: ({ row }: { row: TableRowType }) => {
      const age = row.getValue<string>('age') || '';
      const [days, time] = age.split(', ');
      return h('div', { class: 'flex flex-col' }, [
        h('div', {}, days),
        h('div', { class: 'text-xs text-muted-foreground' }, time || ''),
      ]);
    },
  },
];
</script>

<template>
  <AppTable
    :columns="columns"
    :data-source="getModelsServing"
    :sortable-columns="['creation_timestamp']"
    :filterable-columns="['status']"
    class="grow"
  />
</template>
