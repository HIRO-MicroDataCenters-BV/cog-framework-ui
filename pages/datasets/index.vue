<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';

import DropdownAction from '@/components/app/menu/Actions.vue';
import PreviewDialog from '@/components/app/dialog/Preview.vue';
import ShareDialog from '@/components/app/dialog/Share.vue';
import { useApi } from '@/composables/api';
import { Badge } from '~/components/ui/badge';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';

const dayjs = useDayjs();
const { t } = useI18n();
const { setPage, page } = useApp();
const { user: currentUser } = useCurrentUser();

const tableRef = ref();

const { getDatasets } = useApi();
const {
  previewState,
  loadMorePreview,
  handleFileDownload,
  shareState,
  closeShareDialog,
} = useDatasetActions();

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

      return h('div', { class: 'relative inline-block' }, [
        h(
          'a',
          {
            href: `${urlOrigin}${config.app.baseURL}${baseUrl}/${row.getValue('id')}`,
          },
          row.getValue('dataset_name'),
        ),
        isShared
          ? h(resolveComponent('TooltipProvider'), { delayDuration: 200 }, () =>
              h(resolveComponent('Tooltip'), null, {
                default: () => [
                  h(resolveComponent('TooltipTrigger'), { asChild: true }, () =>
                    h(resolveComponent('Icon'), {
                      name: 'lucide:share-2',
                      class: 'absolute -top-1 -right-4 w-3 h-3 text-blue-500',
                    }),
                  ),
                  h(
                    resolveComponent('TooltipContent'),
                    { side: 'right' },
                    () => `${t('label.shared_by')} ${row.original.user_id}`,
                  ),
                ],
              }),
            )
          : null,
      ]);
    },
  },
  {
    id: 'id',
    accessorFn: (row) => row.id,
    size: 200,
    minSize: 200,
    maxSize: 200,
    cell: ({ row }: { row: TableRowType }) => {
      const idValue = String(row.original.id);
      const shortenedId = shortenUuid(idValue);
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
                    default: () => shortenedId,
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
    size: 140,
    cell: ({ row }: { row: TableRowType }) => {
      const value = parseInt(row.getValue<string>('data_source_type'));
      return h(
        Badge,
        {
          value,
          type: 'type',
        },
        () => [],
      );
    },
  },
  {
    id: 'user_id',
    size: 200,
    cell: ({ row }: { row: TableRowType }) => row.getValue('user_id'),
  },
  {
    id: 'register_date_time',
    size: 140,
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
    size: 80,
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
  <div>
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
