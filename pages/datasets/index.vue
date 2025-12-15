<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';

import DropdownAction from '@/components/app/menu/Actions.vue';
import { useApi } from '@/composables/api';
import { Badge } from '~/components/ui/badge';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';

const dayjs = useDayjs();
const { setPage, page } = useApp();

const tableRef = ref();

const {
  getDatasets,
  deleteDatasetFile,
  deleteDatasetBroker,
  deleteDatasetTopic,
  downloadDatasetFile,
  previewDatasetFile,
  getDatasetById,
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
            console.log('DELETE MESSAGE: Starting, dataset UUID:', id);
            const res = await getDatasetById(id);
            console.log('DELETE MESSAGE: getDatasetById response:', res);
            console.log('DELETE MESSAGE: res?.data:', res?.data);
            console.log('DELETE MESSAGE: topic_details:', res?.data?.topic_details);
            console.log('DELETE MESSAGE: broker_details:', res?.data?.broker_details);
            
            if (res?.data?.topic_details?.id) {
              console.log('DELETE MESSAGE: Deleting topic with ID:', res.data.topic_details.id);
              await deleteDatasetTopic(String(res.data.topic_details.id));
            } else {
              console.log('DELETE MESSAGE: No topic_details.id found');
            }
            
            if (res?.data?.broker_details?.id) {
              console.log('DELETE MESSAGE: Deleting broker with ID:', res.data.broker_details.id);
              await deleteDatasetBroker(String(res.data.broker_details.id));
            } else {
              console.log('DELETE MESSAGE: No broker_details.id found');
            }
            
            tableRef.value.fetchData();
          },
        });
      } else {
        items.push(
          {
            key: 'download_file',
            label: 'download_file',
            action: async () => {
              console.log('DOWNLOAD FILE: Starting, dataset UUID:', id);
              const res = await getDatasetById(id);
              console.log('DOWNLOAD FILE: getDatasetById response:', res);
              console.log('DOWNLOAD FILE: res?.data?.file_id:', res?.data?.file_id);
              
              if (res?.data?.file_id) {
                console.log('DOWNLOAD FILE: Downloading file with ID:', res.data.file_id);
                await downloadDatasetFile(String(res.data.file_id));
              } else {
                console.log('DOWNLOAD FILE: No file_id found in response');
              }
            },
          },
          {
            key: 'preview_file',
            label: 'preview_file',
            action: async () => {
              const res = await getDatasetById(id);
              if (res?.data?.file_id) {
                await previewDatasetFile(String(res.data.file_id));
              }
            },
          },
          {
            key: 'delete_file',
            label: 'delete_file',
            hasConfirmation: true,
            action: async () => {
              const res = await getDatasetById(id);
              if (res?.data?.file_id) {
                await deleteDatasetFile(String(res.data.file_id));
                tableRef.value.fetchData();
              }
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
