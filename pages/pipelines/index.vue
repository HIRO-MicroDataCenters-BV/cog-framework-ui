<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import Badge from '@/components/ui/badge/Badge.vue';
import DropdownAction from '@/components/app/menu/Actions.vue';
import { useApi } from '@/composables/api';
import { usePipelineActions } from '@/composables/usePipelineActions';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';

const { t } = useI18n();

const dayjs = useDayjs();
const { getPipelineRunsListV2 } = useApi();
const mock = useMock();
const { setPage, page } = useApp();

setPage({
  section: 'pipelines',
  description: t('description.pipelines'),
});

const baseUrl = page.value.section;
const config = useRuntimeConfig();
const urlOrigin = window.location.origin;

const { getPipelineActions } = usePipelineActions();
const tableRef = ref();

const columns = [
  {
    id: 'run_name',
    size: 260,
    cell: ({ row }: { row: TableRowType }) => {
      const name =
        (row.getValue<string>('run_name') as string | undefined) ||
        row.getValue<string>('run_id');

      const link = h(
        resolveComponent('NuxtLink'),
        {
          // Use app route path (Nuxt will prepend baseURL automatically)
          to: `/${baseUrl}/${row.getValue('run_id')}`,
          class: 'block truncate max-w-[260px]',
        },
        () => name,
      );

      if (!name || name.length <= 32) {
        return link;
      }

      // Wrap long names in a tooltip to show full text on hover
      return h(
        resolveComponent('TooltipProvider'),
        { delayDuration: 200 },
        () =>
          h(resolveComponent('Tooltip'), null, {
            default: () => [
              h(
                resolveComponent('TooltipTrigger'),
                { asChild: true },
                () => link,
              ),
              h(
                resolveComponent('TooltipContent'),
                { side: 'top' },
                () => name as string,
              ),
            ],
          }),
      );
    },
  },
  {
    id: 'run_id',
    accessorFn: (row) => row.run_id,
    size: 200,
    minSize: 180,
    maxSize: 260,
    cell: ({ row }: { row: TableRowType }) => {
      const runIdValue = String(row.original.run_id);
      const shortenedId = shortenUuid(runIdValue);
      return h(
        CopyPaste,
        {
          hasCopy: true,
          copyText: runIdValue,
        },
        {
          default: () =>
            h(
              resolveComponent('NuxtLink'),
              {
                // Use app route path (Nuxt will prepend baseURL automatically)
                to: `/${baseUrl}/${runIdValue}`,
              },
              () => shortenedId,
            ),
        },
      );
    },
  },
  {
    id: 'start_time',
    size: 180,
    cell: ({ row }: { row: TableRowType }) => {
      const startedOn = row.getValue<string>('start_time');
      return startedOn ? dayjs(startedOn).format('DD.MM.YYYY HH:mm') : '-';
    },
  },
  {
    id: 'experiment_id',
    accessorFn: (row) => row.experiment_id,
    size: 220,
    minSize: 200,
    maxSize: 280,
    cell: ({ row }: { row: TableRowType }) => {
      const experimentIdValue = String(row.original.experiment_id ?? '');
      if (!experimentIdValue) return '-';

      const shortenedId = shortenUuid(experimentIdValue);

      return h(
        CopyPaste,
        {
          hasCopy: true,
          copyText: experimentIdValue,
        },
        {
          default: () => shortenedId,
        },
      );
    },
  },
  {
    id: 'status',
    size: 130,
    cell: ({ row }: { row: TableRowType }) => {
      const rawStatus = (row.getValue<string>('status') || '').toLowerCase();

      const normalized =
        rawStatus === 'succeeded' || rawStatus === 'completed'
          ? 'succeeded'
          : rawStatus === 'running'
            ? 'running'
            : rawStatus === 'failed'
              ? 'failed'
              : rawStatus === 'cancelled' || rawStatus === 'canceled'
                ? 'cancelled'
                : 'pending';

      // Use same color style approach as dataset Type badges
      const statusClasses: Record<string, string> = {
        // Match xgboost model type badge
        succeeded:
          'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100',
        running:
          'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100',
        // Match pytorch model type badge
        failed: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100',
        pending:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100',
        cancelled:
          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100',
      };

      const classes =
        statusClasses[normalized] || 'bg-muted text-muted-foreground';

      const baseClass =
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0';

      const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

      return h('span', { class: `${baseClass} ${classes}` }, label);
    },
  },
  {
    id: 'duration',
    size: 120,
    cell: ({ row }: { row: TableRowType }) => row.getValue('duration'),
  },
  {
    id: 'actions',
    size: 80,
    enableHiding: false,
    cell: ({ row }: { row: TableRowType }) => {
      const id = row.getValue<string>('run_id');
      const name =
        row.getValue<string>('run_name') || row.getValue<string>('run_id');

      const items = getPipelineActions(id, name, () => {
        if (tableRef.value) {
          tableRef.value.fetchData();
        }
      });

      return h(DropdownAction, {
        title: name,
        id,
        items,
        menuTitle: t('title.pipeline_actions'),
      });
    },
  },
];

const tabs = [
  {
    key: 'all',
    value: 'all',
    title: 'All Runs',
    url: '',
    icon: null,
  },
];
</script>

<template>
  <AppTable
    ref="tableRef"
    :columns="columns"
    :data-source="getPipelineRunsListV2"
    :tabs="tabs"
    :has-stats="false"
    :has-filters="false"
    :selectable="false"
  />
</template>
