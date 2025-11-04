<script setup lang="ts">
import type {
  ColumnFiltersState,
  ExpandedState,
  VisibilityState,
} from '@tanstack/vue-table';
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { ref, watch, onMounted, computed, h, resolveComponent } from 'vue';
import { valueUpdater } from '~/utils';
import type {
  SearchFilter,
  SearchFilterParams,
  TableColumn,
  TableDataResponse,
  DataItem,
  ApiTableResponse,
} from '~/types/table.types';
import AppDialogDataset from '~/components/app/dialog/Dataset.vue';
import AppDialogModel from '~/components/app/dialog/Model.vue';

const props = defineProps({
  dataSource: {
    type: Function as PropType<
      (
        params?: Record<string, unknown>,
      ) => Promise<
        | TableDataResponse
        | ApiTableResponse
        | { detail: string }
        | null
        | undefined
      >
    >,
    required: true,
  },
  columns: Array as PropType<TableColumn[]>,
  pageSize: {
    type: Number,
    default: 10,
  },
  tabs: {
    type: Array as PropType<
      {
        key: string;
        value: string;
        title: string;
        url: string;
        icon: string | null;
      }[]
    >,
    default: () => [],
  },
  hasFilters: {
    type: Boolean,
    default: true,
  },
  hasStats: {
    type: Boolean,
    default: true,
  },
  hasSearch: {
    type: Boolean,
    default: true,
  },
  class: {
    type: String,
    default: '',
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  sortableColumns: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const hasStats = ref(props.hasStats);
const hasSearch = ref(props.hasSearch);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { page } = useApp();

const data = shallowRef<DataItem[]>([]);
const totalItems = ref(0);
const pageSize = ref(props.pageSize);

const hasFilters = ref(props.hasFilters);
const isFiltersOpen = ref(true);

const selectedFilterColumn = ref((route.query.column as string) || 'all');
const searchValue = ref((route.query.q as string) || '');

const tabs = computed(() => props.tabs || []);

const validTabs = computed(() => {
  return tabs.value.filter((tab) => tab && tab.key && tab.value && tab.title);
});

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));
const canPreviousPage = computed(() => currentPage.value > 1);
const canNextPage = computed(() => currentPage.value < totalPages.value);

const stat = ref({
  total: {
    key: 'total',
    value: 0,
    icon: 'lucide:table-2',
    label: t('stat.total'),
    color: 'primary',
  },
  files: {
    key: 'files',
    value: 0,
    icon: 'lucide:table',
    label: t('stat.files'),
    color: 'text-blue-500',
  },
  tables: {
    key: 'tables',
    value: 0,
    icon: 'lucide:database',
    label: t('stat.tables'),
    color: 'text-violet-500',
  },
  streams: {
    key: 'streams',
    value: 0,
    icon: 'lucide:circle-dot',
    label: t('stat.streams'),
    color: 'text-green-500',
  },
});

const getFilterColumnName = (columnId: string) => {
  return columnId.includes('_') ? columnId.split('_')[1] : columnId;
};

const getAutoColumn = (searchValue: string): string => {
  // If search value is only numbers, search by id
  if (/^\d+$/.test(searchValue)) {
    return 'id';
  }
  // Otherwise search by name
  return 'name';
};

const fetchData = async () => {
  const params: Record<string, unknown> = {
    page: currentPage.value,
    limit: pageSize.value,
    sort_order: (route.query.sort_order as string) || 'desc',
  };

  // Add sort_by if present in URL
  if (route.query.sort_by) {
    params.sort_by = route.query.sort_by as string;
  }

  if (route.query.q && route.query.column) {
    params[route.query.column as string] = route.query.q;
  } else if (searchValue.value && selectedFilterColumn.value) {
    params[selectedFilterColumn.value as string] = searchValue.value;
  }

  if (route.query.page) {
    params.page = parseInt(route.query.page as string);
  }
  if (route.query.limit) {
    params.limit = parseInt(route.query.limit as string);
  }

  if (route.query.column && route.query.q) {
    params[getFilterColumnName(route.query.column as string)] = route.query.q;
  }

  console.log('fetchData', params);

  try {
    const response = await props.dataSource(params);

    if (response && 'data' in response && 'pagination' in response) {
      const tableData = response.data;
      const pagination = response.pagination;
      data.value = (Array.isArray(tableData) ? tableData : []) as DataItem[];

      if (pagination) {
        // Prefer limit from URL over API response
        if (route.query.limit) {
          pageSize.value =
            parseInt(route.query.limit as string) || props.pageSize;
        } else {
          pageSize.value = pagination.limit ?? props.pageSize;
        }
        totalItems.value = pagination.total_items ?? 0;

        const totalPages = Math.ceil(totalItems.value / pageSize.value) || 1;
        table.setPageSize(pageSize.value);

        if (currentPage.value > totalPages) {
          currentPage.value = Math.max(1, totalPages);
          table.setPageIndex(currentPage.value - 1);
        }
      } else {
        pageSize.value = props.pageSize;
        totalItems.value = data.value.length;
      }
    } else {
      data.value = [];
      pageSize.value = props.pageSize;
      totalItems.value = 0;
    }
  } catch (error) {
    data.value = [];
    pageSize.value = props.pageSize;
    totalItems.value = 0;
  }
};

const toggleTableFilters = () => {
  isFiltersOpen.value = !isFiltersOpen.value;
};

const columnFilters = ref<ColumnFiltersState>(
  route.query.filters
    ? JSON.parse(decodeURIComponent(route.query.filters as string))
    : [],
);
const columnVisibility = ref<VisibilityState>(
  route.query.visibility
    ? JSON.parse(decodeURIComponent(route.query.visibility as string))
    : {},
);
const rowSelection = ref<Record<string, boolean>>({});
const expanded = ref<ExpandedState>({});

const currentPage = ref<number>(
  route.query.page ? parseInt(route.query.page as string) : 1,
);

const currentSortBy = computed(() => (route.query.sort_by as string) || '');
const currentSortOrder = computed(
  () => (route.query.sort_order as string) || 'desc',
);

const handleSort = (columnId: string) => {
  const query = { ...route.query };

  if (currentSortBy.value === columnId) {
    // Toggle sort order if same column
    query.sort_order = currentSortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    // New column, set to asc
    query.sort_by = columnId;
    query.sort_order = 'asc';
  }

  // Reset to first page when sorting
  query.page = '1';
  currentPage.value = 1;

  router.replace({ query });
};

const getColumns = (list: TableColumn[]) => {
  return list.map((item) => {
    const isSortable = props.sortableColumns.includes(item.id);

    return {
      id: item.id,
      accessorKey: item.id,
      header: isSortable
        ? () => {
            const isSorted = currentSortBy.value === item.id;
            const sortOrder = isSorted ? currentSortOrder.value : null;

            return h(
              'div',
              {
                class:
                  'flex items-center gap-2 cursor-pointer select-none hover:text-foreground',
                onClick: () => handleSort(item.id),
              },
              [
                h('span', t(`column.${item.id}`)),
                h(
                  'div',
                  {
                    class: 'flex flex-col',
                  },
                  [
                    h(resolveComponent('Icon'), {
                      name: 'lucide:chevron-up',
                      class: [
                        'h-3 w-3',
                        sortOrder === 'asc'
                          ? 'text-foreground'
                          : 'text-muted-foreground opacity-30',
                      ],
                    }),
                    h(resolveComponent('Icon'), {
                      name: 'lucide:chevron-down',
                      class: [
                        'h-3 w-3 -mt-1',
                        sortOrder === 'desc'
                          ? 'text-foreground'
                          : 'text-muted-foreground opacity-30',
                      ],
                    }),
                  ],
                ),
              ],
            );
          }
        : t(`column.${item.id}`),
      cell: item.cell,
      enableHiding: item.enableHiding,
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  });
};

const columns = ref(getColumns(props.columns ?? []) as any); // eslint-disable-line @typescript-eslint/no-explicit-any
const table = useVueTable({
  data,
  columns: columns.value,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onColumnFiltersChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, columnFilters);
    if (!isUpdatingFromState.value) {
      updateUrlParams();
    }
  },
  onColumnVisibilityChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, columnVisibility);
    if (!isUpdatingFromState.value) {
      updateUrlParams();
    }
  },
  onRowSelectionChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, expanded),
  manualPagination: true,
  globalFilterFn: (row, columnId) => {
    const searchFilter = columnFilters.value.find(
      (filter) => filter.id === 'search',
    ) as SearchFilter | undefined;
    if (!searchFilter) return true;
    if (searchFilter.column !== 'all' && searchFilter.column !== columnId) {
      return true;
    }
    const value = row.getValue(columnId);
    const valueStr = String(value).toLowerCase();
    return valueStr.includes(String(searchFilter.value).toLowerCase());
  },
  initialState: {
    pagination: {
      pageIndex: currentPage.value - 1,
      pageSize: pageSize.value,
    },
  },

  onPaginationChange: (updater) => {
    const newPagination =
      typeof updater === 'function'
        ? updater(table.getState().pagination)
        : updater;

    const newPage = newPagination.pageIndex + 1;
    if (newPage !== currentPage.value) {
      const query = { ...route.query };
      query.page = newPage.toString();
      if (!query.sort_order) {
        query.sort_order = 'desc';
      }
      router.replace({ query });
    }
  },

  state: {
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get expanded() {
      return expanded.value;
    },
    get pagination() {
      return {
        pageIndex: currentPage.value - 1,
        pageSize: pageSize.value,
      };
    },
  },
});

const openAddDataset = ref(false);
const openAddModel = ref(false);
const isUpdatingFromState = ref(false);

const applySearchFilter = () => {
  columnFilters.value = columnFilters.value.filter(
    (filter) => filter.id !== 'search',
  );
  if (!searchValue.value) {
    updateUrlParams();
    return;
  }

  // Auto-detect column based on search value
  const columnToUse = getAutoColumn(searchValue.value);

  const searchFilter: SearchFilter = {
    id: 'search',
    value: searchValue.value,
    column: columnToUse,
  };
  columnFilters.value.push(searchFilter as unknown as SearchFilter);
  updateUrlParams();
};

const updateUrlParams = () => {
  if (isUpdatingFromState.value) return;

  const query: Record<string, string> = {};
  if (columnFilters.value.length > 0) {
    const filter = columnFilters.value[0] as unknown as SearchFilterParams;
    query.q = filter.value;
    query.column = filter.column;
  }

  // Reset to first page when filtering
  currentPage.value = 1;
  query.page = '1';

  if (pageSize.value) {
    query.limit = pageSize.value.toString();
  }

  // Preserve sort_order from URL or set default
  if (route.query.sort_order) {
    query.sort_order = route.query.sort_order as string;
  } else {
    query.sort_order = 'desc';
  }

  // Preserve sort_by from URL if present
  if (route.query.sort_by) {
    query.sort_by = route.query.sort_by as string;
  }

  isUpdatingFromState.value = true;
  router.replace({ query }).then(() => {
    setTimeout(() => {
      isUpdatingFromState.value = false;
    }, 100);
    fetchData();
  });
};

watch(
  () => route.query,
  (newQuery) => {
    if (isUpdatingFromState.value) return;
    isUpdatingFromState.value = true;
    try {
      if (newQuery.filters) {
        columnFilters.value = JSON.parse(
          decodeURIComponent(newQuery.filters as string),
        );
        const filters = columnFilters.value;
        if (filters.length > 0) {
          const searchFilter = filters.find(
            (filter) => filter.id === 'search',
          ) as SearchFilter | undefined;
          if (searchFilter) {
            searchValue.value = searchFilter.value as string;
            selectedFilterColumn.value = searchFilter.column || 'all';
          }
        } else {
          searchValue.value = '';
          selectedFilterColumn.value = 'all';
        }
      } else {
        columnFilters.value = [];
        searchValue.value = '';
        selectedFilterColumn.value = 'all';
      }
      if (newQuery.visibility) {
        columnVisibility.value = JSON.parse(
          decodeURIComponent(newQuery.visibility as string),
        );
      } else {
        columnVisibility.value = {};
      }
      if (newQuery.page) {
        const pageIndex = parseInt(newQuery.page as string);
        currentPage.value = pageIndex;
        table.setPageIndex(pageIndex - 1);
      } else {
        currentPage.value = 1;
        table.setPageIndex(0);
      }

      if (newQuery.limit) {
        const newPageSize = parseInt(newQuery.limit as string);
        if (newPageSize > 0 && newPageSize !== pageSize.value) {
          pageSize.value = newPageSize;
          table.setPageSize(newPageSize);
        }
      }

      // sort_by is handled by currentSortBy computed, no need to update state here
    } catch (error) {
      columnFilters.value = [];
      columnVisibility.value = {};
      currentPage.value = 1;
      table.setPageIndex(0);
    } finally {
      setTimeout(() => {
        isUpdatingFromState.value = false;
        fetchData();
      }, 100);
    }
  },
  { deep: true, immediate: false },
);

const add = () => {
  const section = page.value.section;
  switch (section) {
    case 'dataset_management':
      openAddDataset.value = true;
      break;
    case 'model_management':
      openAddModel.value = true;
      break;
    case 'pipelines':
      navigateTo('/pipelines/builder/new');
      break;
  }
};

onMounted(() => {
  setTimeout(() => {
    if (Object.keys(route.query).length === 0) {
      updateUrlParams();
    } else {
      fetchData();
    }
  }, 50);
});

defineExpose({ fetchData });
</script>

<template>
  <div
    :class="['w-full flex flex-col', props.class]"
    style="height: calc(100vh - 80px)"
  >
    <div class="p-4">
      <div>
        <div class="pb-4 flex justify-between gap-2">
          <div>
            <h2 class="text-2xl font-medium">
              {{ t(`title.${page.section}`) }} ({{ totalItems || 0 }})
            </h2>
          </div>

          <div class="flex gap-2">
            <div class="relative">
              <Input
                v-model="searchValue"
                class="w-64 pl-8"
                type="search"
                :placeholder="t('placeholder.search_by_name_or_id')"
                @update:model-value="applySearchFilter"
              />
              <Icon
                name="lucide:search"
                class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>

            <div class="flex gap-6 items-center">
              <Button @click="() => add()"
                ><Icon name="lucide:plus"></Icon
                >{{ t(`action.add_${page.section}`) }}</Button
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 
      <div>
        <div class="flex gap-2 items-center py-4">
          <div v-if="validTabs.length > 0" class="flex gap-2">
            <Tabs default-value="all">
              <TabsList class="flex">
                <TabsTrigger
                  v-for="item in validTabs"
                  :key="item.key"
                  :value="item.value"
                >
                  <div class="flex items-center">
                    <Icon
                      v-if="item.icon"
                      :name="item.icon"
                      class="h-4 w-4 mr-2"
                    />
                    <span>{{ item.title }}</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      -->
    </div>
    <div class="overflow-x-auto w-full">
      <Table
        :data-source="dataSource"
        :columns="columns"
        :page-size="pageSize"
        class="border-b"
      >
        <TableHeader
          class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 z-10 shadow-xs"
        >
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
              <TableRow v-if="row.getIsExpanded()">
                <TableCell :colspan="row.getAllCells().length">
                  {{ JSON.stringify(row.original) }}
                </TableCell>
              </TableRow>
            </template>
          </template>

          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              {{ t('hint.no_results') }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="py-4 p-4 bg-sidebar-background sticky bottom-0">
      <div class="flex items-center justify-between">
        <div v-if="selectable" class="flex-1 text-sm text-muted-foreground">
          {{ table.getFilteredSelectedRowModel().rows.length }}
          {{ t('hint.of') }} {{ table.getFilteredRowModel().rows.length }}
          {{ t('hint.rows_selected') }}
        </div>
        <div v-else class="flex-1"></div>
        <AppPagination
          :current-page="currentPage"
          :total-items="totalItems"
          :page-size="pageSize"
          :can-previous-page="canPreviousPage"
          :can-next-page="canNextPage"
          :sibling-count="2"
          :show-edges="true"
          :page-size-options="[10, 20, 50, 100]"
          @on-set-page="
            (page: number) => {
              const query = { ...route.query };
              query.page = page.toString();
              if (!query.sort_order) {
                query.sort_order = 'desc';
              }
              router.replace({ query });
            }
          "
          @on-set-page-size="
            (size: number) => {
              const query = { ...route.query };
              query.limit = size.toString();
              query.page = '1';
              if (!query.sort_order) {
                query.sort_order = 'desc';
              }
              router.replace({ query });
            }
          "
        />
      </div>
    </div>
  </div>
  <AppDialogDataset
    :open="openAddDataset"
    @on-close="
      () => {
        openAddDataset = false;
        fetchData();
      }
    "
  />
  <AppDialogModel
    :open="openAddModel"
    @on-close="
      () => {
        openAddModel = false;
        fetchData();
      }
    "
  />
</template>
