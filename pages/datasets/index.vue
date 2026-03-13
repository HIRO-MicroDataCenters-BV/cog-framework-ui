<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';

import DropdownAction from '@/components/app/menu/Actions.vue';
import PreviewDialog from '@/components/app/dialog/Preview.vue';
import ShareDialog from '@/components/app/dialog/Share.vue';
import { useApi } from '@/composables/api';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { useSidebar } from '~/components/ui/sidebar';
import { shortenUuid, getDataTypeFromValue } from '~/utils';

const dayjs = useDayjs();
const { t } = useI18n();
const { setPage, page } = useApp();
const { user: currentUser } = useCurrentUser();
const { state: sidebarState } = useSidebar();

const tableRef = ref();

const { getDatasets: fetchDatasets } = useApi();
const {
  previewState,
  loadMorePreview,
  handleFileDownload,
  shareState,
  closeShareDialog,
} = useDatasetActions();

// Wrapper to add ownership field to datasets
const getDatasets = async (params?: Record<string, unknown>) => {
  const response = await fetchDatasets(params);
  if (response?.data && Array.isArray(response.data)) {
    response.data = response.data.map((item: Record<string, unknown>) => ({
      ...item,
      ownership: item.user_id === currentUser.value?.email ? 'own' : 'shared',
    }));
  }
  return response;
};

const handleDownloadFromPreview = () => {
  if (previewState.value.datasetId) {
    handleFileDownload(previewState.value.datasetId);
  }
};

setPage({
  section: 'datasets',
});

const baseUrl = page.value.section;
const config = useRuntimeConfig();
const urlOrigin = window.location.origin;

const tabs = uselistTabs().value.dataset_management;

const columns = [
  {
    id: 'dataset_name',
    size: 250,
    cell: ({ row }: { row: TableRowType }) => {
      const isShared = row.original.user_id !== currentUser.value?.email;

      const nameLink = h(
        'a',
        {
          href: `${urlOrigin}${config.app.baseURL}${baseUrl}/${row.getValue('id')}`,
          class: 'font-medium truncate block pr-16',
        },
        row.getValue('dataset_name'),
      );

      const sharedBadge = isShared
        ? h(resolveComponent('TooltipProvider'), { delayDuration: 200 }, () =>
            h(resolveComponent('Tooltip'), null, {
              default: () => [
                h(resolveComponent('TooltipTrigger'), { asChild: true }, () =>
                  h(
                    'span',
                    {
                      class:
                        'absolute top-0 right-0 inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 shrink-0 dark:bg-blue-800 dark:text-blue-100',
                    },
                    [
                      h(resolveComponent('Icon'), {
                        name: 'lucide:users',
                        class: 'size-3 shrink-0',
                      }),
                      t('label.shared'),
                    ],
                  ),
                ),
                h(
                  resolveComponent('TooltipContent'),
                  { side: 'right' },
                  () => `${t('label.shared_by')} ${row.original.user_id}`,
                ),
              ],
            }),
          )
        : null;

      return h(
        'div',
        { class: 'relative flex flex-col justify-center min-h-[2.25rem]' },
        [nameLink, sharedBadge],
      );
    },
  },
  {
    id: 'id',
    accessorFn: (row) => row.id,
    size: 220,
    minSize: 180,
    maxSize: 400,
    cell: ({ row }: { row: TableRowType }) => {
      const idValue = String(row.original.id);
      const shortenedId = shortenUuid(idValue);
      const displayId =
        sidebarState.value === 'collapsed' ? idValue : shortenedId;
      return h(
        resolveComponent('TooltipProvider'),
        { delayDuration: 300 },
        () =>
          h(resolveComponent('Tooltip'), null, {
            default: () => [
              h(resolveComponent('TooltipTrigger'), { asChild: true }, () =>
                h(
                  CopyPaste,
                  {
                    hasCopy: true,
                    copyText: idValue,
                  },
                  {
                    default: () => displayId,
                  },
                ),
              ),
              h(resolveComponent('TooltipContent'), null, () => idValue),
            ],
          }),
      );
    },
  },
  {
    id: 'data_source_type',
    size: 120,
    cell: ({ row }: { row: TableRowType }) => {
      const value = parseInt(row.getValue<string>('data_source_type'));
      const typeName = getDataTypeFromValue(value);
      if (!typeName) return null;
      const typeBadgeClasses: Record<string, string> = {
        file: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100',
        database:
          'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100',
        stream:
          'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-100',
        time_series:
          'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100',
      };
      const typeIcons: Record<string, string> = {
        file: 'lucide:file-text',
        database: 'lucide:database',
        stream: 'lucide:radio',
        time_series: 'lucide:calendar',
      };
      const baseClass =
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0';
      return h(
        'span',
        { class: `${baseClass} ${typeBadgeClasses[typeName]}` },
        [
          h(resolveComponent('Icon'), {
            name: typeIcons[typeName],
            class: 'size-3 shrink-0',
          }),
          t(`label.${typeName}`),
        ],
      );
    },
  },
  {
    id: 'user_id',
    size: 140,
    cell: ({ row }: { row: TableRowType }) => row.getValue('user_id'),
  },
  {
    id: 'register_date_time',
    size: 115,
    cell: ({ row }: { row: TableRowType }) => {
      const dateTime = row.getValue<string>('register_date_time');
      return h('div', { class: 'flex flex-col' }, [
        h('div', {}, dayjs(dateTime).format('DD-MMM-YYYY')),
        h(
          'div',
          { class: 'text-xs text-muted-foreground' },
          dayjs(dateTime).format('HH:mm:ss'),
        ),
      ]);
    },
  },
  {
    id: 'actions',
    size: 56,
    enableHiding: false,
    cell: ({ row }: { row: TableRowType }) => {
      const { getDatasetActions } = useDatasetActions();

      const id = row.getValue<string>('id');
      const datasetName = row.getValue<string>('dataset_name');
      const dataSourceType = parseInt(row.getValue<string>('data_source_type'));
      const isShared = row.original.user_id !== currentUser.value?.email;

      const items = getDatasetActions(
        id,
        datasetName,
        dataSourceType,
        () => tableRef.value.fetchData(),
        isShared,
      );

      return h(DropdownAction, {
        title: datasetName,
        id,
        items,
        menuTitle: t('title.dataset_actions'),
      });
    },
  },
];
</script>

<template>
  <div class="flex flex-col h-full">
    <AppTable
      ref="tableRef"
      :columns="columns"
      :data-source="getDatasets"
      :tabs="tabs"
      :sortable-columns="['register_date_time']"
      :filterable-columns="['data_source_type']"
      class="grow"
    />

    <!-- Preview Dialog -->
    <PreviewDialog
      v-model:open="previewState.open"
      :title="previewState.title"
      :data="previewState.data"
      :type="previewState.type"
      :loading="previewState.loading"
      :max-limit-reached="previewState.maxLimitReached"
      @load-more="loadMorePreview"
      @download="handleDownloadFromPreview"
    />

    <!-- Share Dialog -->
    <ShareDialog
      :open="shareState.open"
      :dataset-id="shareState.datasetId"
      :dataset-name="shareState.datasetName"
      @close="closeShareDialog"
    />
  </div>
</template>
