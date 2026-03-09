<script setup lang="ts">
import type { ModelServing } from '~/types/model.types';
import type { TableRowType } from '~/types/row.types';
import ModelServingCard from '~/components/app/ModelServingCard.vue';
import CopyPaste from '~/components/app/CopyPaste.vue';
import DropdownAction from '~/components/app/menu/Actions.vue';
import ModelServingEditDialog from '~/components/app/dialog/ModelServingEdit.vue';
import AppTable from '~/components/app/Table.vue';
import AppPagination from '~/components/app/table/Pagination.vue';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';

const dayjs = useDayjs();
const { t } = useI18n();
const { getModelsServing } = useApi();
const { setPage, page } = useApp();
const menu = uselistMenus();
const tableRef = ref<InstanceType<typeof AppTable> | null>(null);

setPage({
  section: 'model-serving',
});

const list = ref<ModelServing[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref('');
const isRefreshing = ref(false);
const viewMode = ref<'table' | 'cards'>('cards');

// Cards pagination
const cardsCurrentPage = ref(1);
const cardsPageSize = ref(8);
const cardsTotalItems = ref(0);

const editDialogOpen = ref(false);
const selectedModelServing = ref<ModelServing | null>(null);

const sectionIcon = computed(
  () => menu.value.main.find((item) => item.key === page.section)?.icon ?? 'lucide:server',
);

const tableTotalItems = computed(
  () => tableRef.value?.totalItems?.value ?? 0,
);

function openEditDialog(row: ModelServing) {
  selectedModelServing.value = row;
  editDialogOpen.value = true;
}

function closeEditDialog() {
  editDialogOpen.value = false;
  selectedModelServing.value = null;
}

function onEditSaved() {
  tableRef.value?.fetchData();
}

// Watch search query to refetch with debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    cardsCurrentPage.value = 1;
    fetchList();
  }, 300);
});

// AppTable column definitions (same style as models/datasets pages)
const tableColumns = [
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
      if (!name) return h('span', { class: 'text-muted-foreground' }, '—');
      return h('div', { class: 'flex items-center gap-2 overflow-hidden' }, [
        h('span', { class: 'truncate' }, name),
        version
          ? h(
              Badge,
              { variant: 'secondary', class: 'shrink-0 text-[10px]' },
              () => `v${version}`,
            )
          : null,
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
                      h(
                        'span',
                        {
                          class: 'truncate block max-w-[280px] text-xs',
                        },
                        url ?? '—',
                      ),
                  },
                ),
              ),
              h(resolveComponent('TooltipContent'), null, () => url ?? ''),
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
        ready:
          'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100',
        pending:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100',
        failed: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100',
        unknown:
          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100',
        terminating:
          'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100',
      };
      const classes =
        statusClasses[status ?? ''] ||
        'bg-muted text-muted-foreground';
      return h(
        'span',
        {
          class: `inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${classes}`,
        },
        status ?? '—',
      );
    },
  },
  {
    id: 'traffic_percentage',
    size: 80,
    cell: ({ row }: { row: TableRowType }) => {
      const traffic = row.getValue<number>('traffic_percentage');
      return h('span', {}, `${traffic ?? 0}%`);
    },
  },
  {
    id: 'creation_timestamp',
    size: 115,
    cell: ({ row }: { row: TableRowType }) => {
      const dateTime = row.getValue<string>('creation_timestamp');
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
    id: 'age',
    size: 120,
    cell: ({ row }: { row: TableRowType }) => {
      const age = row.getValue<string>('age') || '';
      const [days, time] = age.split(', ');
      return h('div', { class: 'flex flex-col' }, [
        h('div', {}, days || '—'),
        h('div', { class: 'text-xs text-muted-foreground' }, time ?? ''),
      ]);
    },
  },
  {
    id: 'actions',
    size: 56,
    enableHiding: false,
    cell: ({ row }: { row: TableRowType }) => {
      return h(DropdownAction, {
        title: row.getValue('isvc_name') as string,
        id: row.getValue('isvc_name') as string,
        items: [
          {
            key: 'edit',
            label: 'edit',
            action: () => openEditDialog(row.original as ModelServing),
          },
        ],
        menuTitle: t('title.model_serving_actions'),
      });
    },
  },
];

async function fetchList() {
  if (!isRefreshing.value) loading.value = true;
  error.value = null;
  try {
    const res = await getModelsServing({
      page: cardsCurrentPage.value,
      limit: cardsPageSize.value,
      search: searchQuery.value || undefined,
    });
    const data = res?.data;
    list.value = Array.isArray(data) ? data : [];
    cardsTotalItems.value = res?.pagination?.total_items ?? 0;
  } catch (e) {
    console.error(e);
    error.value = 'Failed to load model serving list.';
  } finally {
    loading.value = false;
    isRefreshing.value = false;
  }
}

const cardsTotalPages = computed(() => Math.ceil(cardsTotalItems.value / cardsPageSize.value));
const cardsCanPreviousPage = computed(() => cardsCurrentPage.value > 1);
const cardsCanNextPage = computed(() => cardsCurrentPage.value < cardsTotalPages.value);

function setCardsPage(page: number) {
  cardsCurrentPage.value = page;
  isRefreshing.value = true; // Keep cards + pagination visible during fetch
  fetchList();
}

function setCardsPageSize(size: number) {
  cardsPageSize.value = size;
  cardsCurrentPage.value = 1;
  isRefreshing.value = true; // Keep cards + pagination visible during fetch
  fetchList();
}

function refresh() {
  isRefreshing.value = true;
  fetchList();
}

function onCardUpdated() {
  fetchList();
}

function onServeModel() {
  // TODO: Open serve-model dialog or navigate to serve flow
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <!-- Table view: AppTable with its own header -->
  <AppTable
    v-if="viewMode === 'table'"
    ref="tableRef"
    :columns="tableColumns"
    :data-source="getModelsServing"
    :sortable-columns="['creation_timestamp']"
    :filterable-columns="['status']"
    :page-size="10"
    class="grow"
  >
    <template #header-actions>
      <div class="flex rounded-md border border-border overflow-hidden shrink-0">
        <Button
          variant="ghost"
          size="sm"
          class="rounded-none h-8 px-2.5 bg-muted"
          title="Table view"
        >
          <Icon name="lucide:table-2" class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="rounded-none h-8 px-2.5"
          title="Cards view"
          @click="viewMode = 'cards'"
        >
          <Icon name="lucide:layout-grid" class="h-4 w-4" />
        </Button>
      </div>
    </template>
  </AppTable>

  <!-- Cards view -->
  <div v-else class="w-full flex flex-col h-svh">
    <!-- Header for cards view -->
    <div class="pl-4 p-3">
      <div class="pb-2 flex justify-between gap-2">
        <div>
          <h2 class="text-xl font-medium flex items-center gap-2">
            <Icon :name="sectionIcon" class="h-4 w-4 mr-2" />
            {{ t(`title.${page.section}`) }}
            ({{ cardsTotalItems }})
          </h2>
        </div>

        <div class="flex gap-2">
          <div class="relative">
            <Input
              v-model="searchQuery"
              class="w-64 pl-8"
              type="search"
              :placeholder="t('placeholder.search_by_name_or_id')"
            />
            <Icon
              name="lucide:search"
              class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          <div class="flex gap-2 items-center">
            <div class="flex rounded-md border border-border overflow-hidden shrink-0">
              <Button
                variant="ghost"
                size="sm"
                class="rounded-none h-8 px-2.5"
                :class="viewMode === 'table' ? 'bg-muted' : ''"
                title="Table view"
                @click="viewMode = 'table'"
              >
                <Icon name="lucide:table-2" class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="rounded-none h-8 px-2.5"
                :class="viewMode === 'cards' ? 'bg-muted' : ''"
                title="Cards view"
                @click="viewMode = 'cards'"
              >
                <Icon name="lucide:layout-grid" class="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              class="cursor-pointer shrink-0"
              :title="t('action.refresh')"
              :disabled="isRefreshing"
              @click="refresh()"
            >
              <Icon
                name="lucide:refresh-cw"
                :class="[
                  'h-4 w-4 transition-transform duration-300',
                  isRefreshing && 'animate-spin',
                ]"
              />
            </Button>

            <Button class="cursor-pointer gap-2" @click="onServeModel">
              <Icon name="lucide:plus" class="h-4 w-4" />
              {{ t(`action.add_${page.section}`) }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cards content: loading / error / empty / cards -->
    <div class="flex-1 flex flex-col min-h-0 px-4 pb-0">
      <div
          v-if="loading"
          class="flex items-center justify-center min-h-[280px]"
        >
          <div class="text-center">
            <Spinner class="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">Loading served models...</p>
          </div>
        </div>

        <div
          v-else-if="error"
          class="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-6 text-center"
        >
          <p class="text-sm text-destructive">{{ error }}</p>
          <Button variant="outline" size="sm" class="mt-3" @click="fetchList">
            Retry
          </Button>
        </div>

        <div
          v-else-if="list.length === 0 && !searchQuery"
          class="flex flex-col items-center justify-center min-h-[280px] text-center"
        >
          <div class="rounded-full bg-muted/50 p-4 mb-4">
            <Icon
              name="lucide:server"
              class="w-10 h-10 text-muted-foreground/60"
            />
          </div>
          <h3 class="font-semibold text-foreground mb-1">No served models</h3>
          <p class="text-sm text-muted-foreground max-w-sm">
            Deployed inference services will appear here. Each card shows traffic split and lets you adjust canary percentage.
          </p>
        </div>

        <div
          v-else-if="list.length === 0 && searchQuery"
          class="flex flex-col items-center justify-center min-h-[200px] text-center rounded-lg border border-dashed bg-muted/20"
        >
          <p class="text-sm text-muted-foreground">
            No results for "{{ searchQuery }}"
          </p>
          <Button variant="ghost" size="sm" class="mt-2" @click="searchQuery = ''">
            Clear search
          </Button>
        </div>

        <template v-else>
          <!-- Cards grid - scrollable area -->
          <div class="flex-1 overflow-auto min-h-0">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <ModelServingCard
                v-for="item in list"
                :key="item.isvc_name"
                :serving="item"
                @updated="onCardUpdated"
              />
            </div>
          </div>

          <!-- Pagination bar - same style as Table (always visible at bottom) -->
          <div
            v-if="cardsTotalItems > cardsPageSize"
            class="shrink-0 py-1 px-4 border-t border-border bg-card flex items-center -mx-4"
          >
            <AppPagination
              class="w-full"
              :current-page="cardsCurrentPage"
              :total-items="cardsTotalItems"
              :page-size="cardsPageSize"
              :can-previous-page="cardsCanPreviousPage"
              :can-next-page="cardsCanNextPage"
              :sibling-count="2"
              :show-edges="true"
              :page-size-options="[8, 12, 16]"
              @on-set-page="setCardsPage"
              @on-set-page-size="setCardsPageSize"
            />
          </div>
        </template>
    </div>
  </div>

  <ModelServingEditDialog
    :open="editDialogOpen"
    :model-serving="selectedModelServing"
    @close="closeEditDialog"
    @saved="onEditSaved"
  />
</template>
