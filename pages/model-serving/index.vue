<script setup lang="ts">
import type { ModelServing } from '~/types/model.types';
import type { TableRowType } from '~/types/row.types';
import ModelServingCard from '~/components/app/ModelServingCard.vue';
import ModelServingSheet from '~/components/app/ModelServingSheet.vue';
import CopyPaste from '~/components/app/CopyPaste.vue';
import DropdownAction from '~/components/app/menu/Actions.vue';
import ModelServingEditDialog from '~/components/app/dialog/ModelServingEdit.vue';
import ModelServingCanaryDialog from '~/components/app/dialog/ModelServingCanaryDialog.vue';
import ServeModelDialog from '~/components/app/dialog/ServeModelDialog.vue';
import AppTable from '~/components/app/Table.vue';
import AppPagination from '~/components/app/table/Pagination.vue';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Spinner } from '~/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';

const dayjs = useDayjs();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getModelsServing, deleteModelServing } = useApi();
const toaster = useToaster();
const { setPage, page } = useApp();
const menu = uselistMenus();
const tableRef = ref<InstanceType<typeof AppTable> | null>(null);

setPage({
  section: 'model-serving',
});

const list = ref<ModelServing[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const isRefreshing = ref(false);
const viewMode = ref<'table' | 'cards'>('cards');

// Cards pagination - init from route query (same keys as table view)
const cardsCurrentPage = ref(
  parseInt((route.query.page as string) || '1', 10) || 1,
);
const cardsPageSize = ref(
  parseInt((route.query.limit as string) || '8', 10) || 8,
);
const searchQuery = ref((route.query.search as string) || '');
const statusFilter = ref((route.query.status as string) || 'all');
const sortOrder = ref<'asc' | 'desc'>(
  (['asc', 'desc'].includes(route.query.sort_order as string)
    ? route.query.sort_order
    : 'desc') as 'asc' | 'desc',
);
const cardsTotalItems = ref(0);

const SORT_OPTIONS = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
] as const;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'ready', label: 'Ready' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'terminating', label: 'Terminating' },
  { value: 'unknown', label: 'Unknown' },
] as const;

const editDialogOpen = ref(false);
const selectedModelServing = ref<ModelServing | null>(null);
const canaryDialogOpen = ref(false);
const canaryBaseServing = ref<ModelServing | null>(null);
const sheetOpen = ref(false);
const sheetServing = ref<ModelServing | null>(null);
const refreshingStatusIsvcName = ref<string | null>(null);
const deleteConfirmOpen = ref(false);
const deleteConfirmServing = ref<ModelServing | null>(null);

const sectionIcon = computed(
  () =>
    menu.value.main.find((item) => item.key === page.section)?.icon ??
    'lucide:server',
);

const tableTotalItems = computed(() => tableRef.value?.totalItems?.value ?? 0);

function openEditDialog(row: ModelServing) {
  selectedModelServing.value = row;
  editDialogOpen.value = true;
}

function closeEditDialog() {
  editDialogOpen.value = false;
  selectedModelServing.value = null;
}

function openCanaryDialog(serving: ModelServing) {
  canaryBaseServing.value = serving;
  canaryDialogOpen.value = true;
}

function closeCanaryDialog() {
  canaryDialogOpen.value = false;
  canaryBaseServing.value = null;
}

function openSheet(serving: ModelServing) {
  sheetServing.value = serving;
  sheetOpen.value = true;
}

function closeSheet() {
  sheetOpen.value = false;
  sheetServing.value = null;
}

function onSheetEdit(serving: ModelServing) {
  closeSheet();
  selectedModelServing.value = serving;
  editDialogOpen.value = true;
}

function onSheetDelete(serving: ModelServing) {
  deleteConfirmServing.value = serving;
  deleteConfirmOpen.value = true;
}

async function confirmDeleteServing() {
  const serving = deleteConfirmServing.value;
  if (!serving) return;
  try {
    await deleteModelServing(serving.isvc_name);
    if (sheetServing.value?.isvc_name === serving.isvc_name) {
      closeSheet();
    }
    deleteConfirmOpen.value = false;
    deleteConfirmServing.value = null;
    await fetchList();
  } catch (e) {
    console.error(e);
    toaster.show('error', 'operation_failed');
  }
}

function onEditSaved(payload?: {
  isvc_name: string;
  canary_traffic_percent: number;
}) {
  if (payload) {
    updateServingInList(payload);
  }
}

function updateServingInList(payload: {
  isvc_name: string;
  canary_traffic_percent: number;
}) {
  const idx = list.value.findIndex((s) => s.isvc_name === payload.isvc_name);
  if (idx >= 0) {
    const updated = {
      ...list.value[idx],
      canary_traffic_percent: payload.canary_traffic_percent,
      stable_traffic_percent: 100 - payload.canary_traffic_percent,
    };
    list.value = list.value.map((s, i) => (i === idx ? updated : s));
    if (sheetServing.value?.isvc_name === payload.isvc_name) {
      sheetServing.value = updated;
    }
    if (selectedModelServing.value?.isvc_name === payload.isvc_name) {
      selectedModelServing.value = updated;
    }
  }
}

// Watch search query - update route with debounce (route watch will trigger fetch)
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = { ...route.query } as Record<string, string>;
    query.page = '1';
    if (searchQuery.value) {
      query.search = searchQuery.value;
    } else {
      delete query.search;
    }
    router.replace({ query });
  }, 300);
});

// Watch route.query - sync cards state and fetch when URL changes (e.g. pagination, back button)
watch(
  () => route.query,
  (query) => {
    if (viewMode.value !== 'cards') return;
    const page = parseInt((query.page as string) || '1', 10) || 1;
    const limit = parseInt((query.limit as string) || '8', 10) || 8;
    const search = (query.search as string) || '';
    const status = (query.status as string) || 'all';
    const order = (
      ['asc', 'desc'].includes(query.sort_order as string)
        ? query.sort_order
        : 'desc'
    ) as 'asc' | 'desc';
    if (page !== cardsCurrentPage.value) cardsCurrentPage.value = page;
    if (limit !== cardsPageSize.value) cardsPageSize.value = limit;
    if (search !== searchQuery.value) searchQuery.value = search;
    if (status !== statusFilter.value) statusFilter.value = status;
    if (order !== sortOrder.value) sortOrder.value = order;
    isRefreshing.value = true;
    fetchList();
  },
  { deep: true },
);

// Watch status filter - update route
watch(statusFilter, () => {
  const query = { ...route.query } as Record<string, string>;
  query.page = '1';
  if (statusFilter.value && statusFilter.value !== 'all') {
    query.status = statusFilter.value;
  } else {
    delete query.status;
  }
  router.replace({ query });
});

// Watch sort order - update route
watch(sortOrder, () => {
  const query = { ...route.query } as Record<string, string>;
  query.page = '1';
  query.sort_by = 'creation_timestamp';
  query.sort_order = sortOrder.value;
  router.replace({ query });
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
        statusClasses[status ?? ''] || 'bg-muted text-muted-foreground';
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
      sort_by: 'creation_timestamp',
      sort_order: sortOrder.value,
      ...(statusFilter.value &&
        statusFilter.value !== 'all' && { status: statusFilter.value }),
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

const cardsTotalPages = computed(() =>
  Math.ceil(cardsTotalItems.value / cardsPageSize.value),
);
const cardsCanPreviousPage = computed(() => cardsCurrentPage.value > 1);
const cardsCanNextPage = computed(
  () => cardsCurrentPage.value < cardsTotalPages.value,
);

function setCardsPage(pageNum: number) {
  const query = { ...route.query } as Record<string, string>;
  query.page = pageNum.toString();
  router.replace({ query });
}

function setCardsPageSize(size: number) {
  const query = { ...route.query } as Record<string, string>;
  query.limit = size.toString();
  query.page = '1';
  router.replace({ query });
}

function refresh() {
  isRefreshing.value = true;
  fetchList();
}

function onCardUpdated(payload: {
  isvc_name: string;
  canary_traffic_percent: number;
}) {
  updateServingInList(payload);
}

async function onCardRefreshStatus(isvcName: string) {
  refreshingStatusIsvcName.value = isvcName;
  const original = list.value.slice();
  try {
    const res = await getModelsServing({
      isvc_name: isvcName,
      limit: 1,
    } as unknown as Record<string, unknown>);
    type ServingListResponse = { data: ModelServing[] } | null;
    const updated = (res as ServingListResponse)?.data?.[0];
    if (!updated) return;
    const idx = list.value.findIndex((s) => s.isvc_name === updated.isvc_name);
    if (idx >= 0) {
      list.value = list.value.map((s, i) => (i === idx ? updated : s));
    }
  } catch (error) {
    console.error('Failed to refresh serving status', error);
    // trigger re-render to stop spin even if status unchanged
    list.value = original;
  } finally {
    refreshingStatusIsvcName.value = null;
  }
}

const serveDialogOpen = ref(false);

function onServeModel() {
  serveDialogOpen.value = true;
}

function closeServeDialog() {
  serveDialogOpen.value = false;
}

function onServeCreated() {
  fetchList();
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Table view: AppTable with its own header -->
    <AppTable
      v-if="viewMode === 'table'"
      ref="tableRef"
      :columns="tableColumns"
      :data-source="getModelsServing"
      :sortable-columns="['creation_timestamp']"
      :filterable-columns="['status']"
      :page-size="10"
      search-placeholder-key="placeholder.search_by_name"
      class="grow"
    >
      <template #header-actions>
        <div
          class="flex rounded-md border border-border overflow-hidden shrink-0"
        >
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
                :placeholder="t('placeholder.search_by_name')"
              />
              <Icon
                name="lucide:search"
                class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>

            <Select v-model="statusFilter">
              <SelectTrigger class="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in STATUS_OPTIONS"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select v-model="sortOrder">
              <SelectTrigger class="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in SORT_OPTIONS"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <div class="flex gap-2 items-center">
              <div
                class="flex rounded-md border border-border overflow-hidden shrink-0"
              >
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
            <p class="text-sm text-muted-foreground">
              Loading served models...
            </p>
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
            Deployed inference services will appear here. Each card shows
            traffic split and lets you adjust canary percentage.
          </p>
        </div>

        <div
          v-else-if="list.length === 0 && searchQuery"
          class="flex flex-col items-center justify-center min-h-[200px] text-center rounded-lg border border-dashed bg-muted/20"
        >
          <p class="text-sm text-muted-foreground">
            No results for "{{ searchQuery }}"
          </p>
          <Button
            variant="ghost"
            size="sm"
            class="mt-2"
            @click="searchQuery = ''"
          >
            Clear search
          </Button>
        </div>

        <template v-else>
          <!-- Cards grid - scrollable area -->
          <div class="flex-1 overflow-auto min-h-0">
            <div
              class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <ModelServingCard
                v-for="item in list"
                :key="item.isvc_name"
                :serving="item"
                :refreshing="refreshingStatusIsvcName === item.isvc_name"
                @select="openSheet(item)"
                @updated="onCardUpdated"
                @create-canary="(serving) => openCanaryDialog(serving)"
                @refresh-status="onCardRefreshStatus"
              />
            </div>
          </div>

          <!-- Pagination bar - same style as Table (always visible at bottom) -->
          <div
            v-if="cardsTotalItems > 0"
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

    <ModelServingSheet
      v-model:open="sheetOpen"
      :serving="sheetServing"
      @edit="onSheetEdit"
      @delete="onSheetDelete"
    />

    <AlertDialog
      :open="deleteConfirmOpen"
      @update:open="deleteConfirmOpen = $event"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('title.are_you_sure') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t('alert.delete_model_service', {
                name: deleteConfirmServing?.isvc_name ?? '',
              })
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="cursor-pointer">
            {{ t('action.cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            class="cursor-pointer"
            @click="confirmDeleteServing"
          >
            {{ t('action.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <ModelServingEditDialog
      :open="editDialogOpen"
      :model-serving="selectedModelServing"
      @close="closeEditDialog"
      @saved="(p) => onEditSaved(p)"
    />

    <ModelServingCanaryDialog
      :open="canaryDialogOpen"
      :base-serving="canaryBaseServing"
      @close="closeCanaryDialog"
      @created="fetchList"
    />

    <ServeModelDialog
      :open="serveDialogOpen"
      @close="closeServeDialog"
      @created="onServeCreated"
    />
  </div>
</template>
