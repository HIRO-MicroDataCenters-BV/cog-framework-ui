<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import { useApi } from '@/composables/api';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { shortenUuid } from '~/utils';

const { t } = useI18n();
const dayjs = useDayjs();
const { getExperimentsListV2 } = useApi();
const { setPage } = useApp();

setPage({
  section: 'pipeline_experiments',
  description: t('description.pipeline_experiments'),
});

const tableRef = ref();

/** Wrapper that forwards AppTable params straight to the KFP experiments API. */
const getExperiments = async (params: Record<string, unknown> = {}) => {
  return getExperimentsListV2(params);
};

const columns = [
  {
    id: 'experiment_name',
    size: 300,
    cell: ({ row }: { row: TableRowType }) => {
      const name =
        (row.getValue<string>('experiment_name') as string | undefined) ||
        row.getValue<string>('experiment_id');

      return h(
        'span',
        { class: 'block truncate max-w-[300px] font-medium' },
        name,
      );
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
    id: 'created_at',
    size: 140,
    cell: ({ row }: { row: TableRowType }) => {
      const createdAt = row.getValue<string>('created_at');
      if (!createdAt) return '-';
      return h('div', { class: 'flex flex-col' }, [
        h('div', {}, dayjs(createdAt).format('DD-MMM-YYYY')),
        h(
          'div',
          { class: 'text-xs text-muted-foreground' },
          dayjs(createdAt).format('HH:mm:ss'),
        ),
      ]);
    },
  },
];
</script>

<template>
  <AppTable
    ref="tableRef"
    :columns="columns"
    :data-source="getExperiments"
    :has-stats="true"
    :has-filters="false"
    :selectable="false"
  />
</template>
