<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';

import DropdownAction from '@/components/app/menu/Actions.vue';
import { useApi } from '@/composables/api';
import { Badge } from '~/components/ui/badge';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';

const dayjs = useDayjs();
const { setPage, page } = useApp();
const { getDatasets } = useApi();

const tableRef = ref();

const {
  deleteDatasetFile,
  deleteDatasetBroker,
  deleteDatasetTopic,
  deleteDatasetMessage,
  downloadDatasetFile,
  previewDatasetFile,
  getDatasetMessageDetails,
} = useApi();

setPage({
  section: 'datasets',
});

const baseUrl = page.value.section;

const tabs = uselistTabs().value.dataset_management;

const columns = [
  {
    id: 'dataset_name',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'a',
        { href: `${baseUrl}/${row.getValue('id')}` },
        row.getValue('dataset_name'),
      ),
  },
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
  {
    id: 'data_source_type',
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
    cell: ({ row }: { row: TableRowType }) => row.getValue('user_id'),
  },
  {
    id: 'register_date_time',
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'span',
        {
          class: 'font-mono',
          title: dayjs(row.getValue<string>('register_date_time')).format(
            'DD MMM YYYY HH:mm:ss',
          ),
        },
        dayjs(row.getValue<string>('register_date_time')).format('DD MMM YYYY'),
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
        dayjs(row.getValue<string>('last_modified_time')).format('DD MMM YYYY'),
      ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }: { row: TableRowType }) => {
      const id = row.getValue<string>('id');
      const dataSourceType = parseInt(row.getValue<string>('data_source_type'));
      const isStream = [10, 11].includes(dataSourceType);

      const items = [];

      if (isStream) {
        items.push({
          key: 'delete_message',
          label: 'delete_message',
          hasConfirmation: true,
          action: async () => {
            // Retrieve the real integer ID for the message dataset
            const res = await getDatasetMessageDetails(id);
            // @ts-expect-error -- response type from getDatasetMessageDetails is complex union
            if (res && res.data && res.data.dataset && res.data.dataset.id) {
              // @ts-expect-error -- dataset property not inferred correctly in union
              const integerId = res.data.dataset.id;
              await deleteDatasetMessage(String(integerId));
              tableRef.value.fetchData();
            }
          },
        });
      } else {
        items.push(
          {
            key: 'download_file',
            label: 'download_file',
            action: async () => {
              await downloadDatasetFile(id);
            },
          },
          {
            key: 'preview_file',
            label: 'preview_file',
            action: async () => {
              // Preview logic usually requires a modal or separate view.
              // For now we will just call the API.
              await previewDatasetFile(id);
            },
          },
          {
            key: 'delete_file',
            label: 'delete_file',
            hasConfirmation: true,
            action: async () => {
              await deleteDatasetFile(id);
              tableRef.value.fetchData();
            },
          },
        );
      }

      return h(DropdownAction, {
        title: row.getValue('dataset_name') as string,
        id,
        items,
      });
    },
  },
];
</script>

<template>
  <AppTable
    ref="tableRef"
    :columns="columns"
    :data-source="getDatasets"
    :tabs="tabs"
    :sortable-columns="['last_modified_time']"
    :filterable-columns="['data_source_type']"
    class="flex-grow"
  />
</template>
