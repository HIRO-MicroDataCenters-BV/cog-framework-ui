<script setup lang="ts">
import type { TableRowType } from '@/types/row.types';
import { useApi } from '@/composables/api';
import CopyPaste from '~/components/app/CopyPaste.vue';
import { useSidebar } from '~/components/ui/sidebar';
import { shortenUuid } from '~/utils';
import { Badge } from '~/components/ui/badge';
import DropdownAction from '@/components/app/menu/Actions.vue';
import ModelServingCreateFromModel from '@/components/app/dialog/ModelServingCreateFromModel.vue';

const dayjs = useDayjs();
const { t } = useI18n();
const { getModels, deleteModel } = useApi();
const { setPage, page } = useApp();
const { state: sidebarState } = useSidebar();
const tableRef = ref();
const createServingOpen = ref(false);
const selectedModelForServing = ref<any | null>(null);

const openCreateServingFor = (model: any) => {
  selectedModelForServing.value = model;
  createServingOpen.value = true;
};

setPage({
  section: 'models',
});

const baseUrl = page.value.section;
const config = useRuntimeConfig();
const urlOrigin = window.location.origin;

const columns = [
  {
    id: 'name',
    size: 250,
    cell: ({ row }: { row: TableRowType }) =>
      h(
        'a',
        {
          href: `${urlOrigin}${config.app.baseURL}${baseUrl}/${row.getValue('id')}`,
        },
        row.getValue('name'),
      ),
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
    id: 'version',
    size: 72,
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
    size: 120,
    cell: ({ row }: { row: TableRowType }) => {
      const value = (row.getValue<string>('type') || '').toLowerCase();
      const modelTypeBadgeClasses: Record<string, string> = {
        sklearn:
          'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100',
        pytorch: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100',
        tensorflow:
          'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-100',
        xgboost:
          'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100',
        xcboost:
          'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100',
        keras:
          'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100',
        pyfunc: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-800 dark:text-cyan-100',
        classification:
          'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100',
      };
      const modelTypeIcons: Record<string, string> = {
        sklearn: 'lucide:box',
        pytorch: 'lucide:box',
        tensorflow: 'lucide:box',
        xgboost: 'lucide:box',
        xcboost: 'lucide:box',
        keras: 'lucide:box',
        pyfunc: 'lucide:box',
        classification: 'lucide:box',
      };
      const classes = modelTypeBadgeClasses[value];
      if (!classes) return value || null;
      const baseClass =
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0';
      return h('span', { class: `${baseClass} ${classes}` }, [
        h(resolveComponent('Icon'), {
          name: modelTypeIcons[value] || 'lucide:box',
          class: 'size-3 shrink-0',
        }),
        value,
      ]);
    },
  },
  {
    id: 'register_user_id',
    size: 140,
    cell: ({ row }: { row: TableRowType }) => row.getValue('register_user_id'),
  },
  {
    id: 'register_date',
    size: 115,
    cell: ({ row }: { row: TableRowType }) => {
      const dateTime = row.getValue<string>('register_date');
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
      const id = row.getValue<string>('id');

      return h(DropdownAction, {
        title: row.getValue('name') as string,
        id,
        items: [
          {
            key: 'create_model_serving',
            label: 'create_model_serving',
            icon: 'lucide:server',
            action: async () => {
              openCreateServingFor(row.original);
            },
          },
          {
            key: 'delete_model',
            label: 'delete_model',
            hasConfirmation: true,
            action: async () => {
              await deleteModel(id);
              tableRef.value.fetchData();
            },
          },
        ],
        menuTitle: t('title.model_actions'),
      });
    },
  },
];

const tabs = uselistTabs().value.model_management;
</script>

<template>
  <div class="flex flex-col h-full">
    <AppTable
      ref="tableRef"
      :columns="columns"
      :data-source="getModels"
      :tabs="tabs"
      :sortable-columns="['register_date']"
      :filterable-columns="['type']"
      group-by="name"
      class="grow"
    />

    <ModelServingCreateFromModel
      :open="createServingOpen"
      :model="selectedModelForServing"
      @close="createServingOpen = false"
      @created="tableRef?.fetchData?.()"
    />
  </div>
</template>
