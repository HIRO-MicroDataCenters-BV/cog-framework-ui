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
const { getPipelineRunsList } = useApi();
const mock = useMock();
const { setPage, page } = useApp();

setPage({
  section: 'pipelines',
  description: t('description.pipelines'),
});

const baseUrl = page.value.section;

const { getPipelineActions } = usePipelineActions();
const tableRef = ref();

const columns = [
  {
    id: 'run_name',
    cell: ({ row }: { row: TableRowType }) => {
      const fullName =
        (row.getValue<string>('run_name') as string | undefined) ||
        (row.getValue<string>('run_id') as string);
      const maxLength = 40;
      const isTruncated = !!fullName && fullName.length > maxLength;
      const displayName =
        fullName && isTruncated
          ? `${fullName.slice(0, maxLength - 3)}...`
          : fullName;

      const linkVNode = h(
        resolveComponent('NuxtLink'),
        {
          to: `/${baseUrl}/${row.getValue('run_id')}`,
          class: 'truncate max-w-[260px] inline-block align-middle',
        },
        () => displayName,
      );

      if (!isTruncated) {
        return linkVNode;
      }

      return h(
        resolveComponent('TooltipProvider'),
        { delayDuration: 300 },
        () =>
          h(resolveComponent('Tooltip'), null, {
            default: () => [
              h(
                resolveComponent('TooltipTrigger'),
                { asChild: true },
                () => linkVNode,
              ),
              h(
                resolveComponent('TooltipContent'),
                null,
                () => fullName,
              ),
            ],
          }),
      );
    },
  },
  {
    id: 'run_id',
    accessorFn: (row) => row.run_id,
    size: 220,
    minSize: 200,
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
              { to: `/${baseUrl}/${runIdValue}` },
              () => shortenedId,
            ),
        },
      );
    },
  },
  {
    id: 'start_time',
    size: 180,
    minSize: 160,
    maxSize: 220,
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
    maxSize: 260,
    cell: ({ row }: { row: TableRowType }) => {
      const experimentIdValue = String(row.original.experiment_id);
      const shortenedId = shortenUuid(experimentIdValue);
      return h(
        CopyPaste,
        {
          hasCopy: true,
          copyText: experimentIdValue,
        },
        {
          default: () =>
            h(
              'span',
              {},
              shortenedId,
            ),
        },
      );
    },
  },
  {
    id: 'status',
    size: 130,
    cell: ({ row }: { row: TableRowType }) => {
      const rawStatus = (row.getValue<string>('status') || '').toLowerCase();

      const statusClasses: Record<string, string> = {
        succeeded:
          'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100',
        running:
          'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100',
        failed: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100',
        pending:
          'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-100',
        unknown:
          'bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground',
      };

      const statusIcons: Record<string, string> = {
        succeeded: 'lucide:check-circle-2',
        running: 'lucide:loader-2',
        failed: 'lucide:alert-circle',
        pending: 'lucide:clock',
        unknown: 'lucide:dot',
      };

      const normalized = rawStatus || 'unknown';
      const baseClass =
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0';

      return h(
        'span',
        {
          class: `${baseClass} ${
            statusClasses[normalized] || statusClasses.unknown
          }`,
        },
        [
          h(resolveComponent('Icon'), {
            name: statusIcons[normalized] || statusIcons.unknown,
            class: 'size-3 shrink-0',
          }),
          normalized,
        ],
      );
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
const data = mock.value.pipelineRuns;
const mockDataSource = (params = {}) => {
  return Promise.resolve({
    data: data,
    total: data.length,
    page: 1,
    pageSize: data.length,
  });
};
console.log(data);
</script>

<template>
  <AppTable
    ref="tableRef"
    :columns="columns"
    :data-source="getPipelineRunsList"
    :tabs="tabs"
    :has-stats="false"
    :has-filters="false"
    :selectable="false"
  />
</template>
