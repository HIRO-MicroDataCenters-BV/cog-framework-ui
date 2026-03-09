<script setup lang="ts">
import type {
  ColumnFiltersState,
  ExpandedState,
  VisibilityState,
  ColumnDef,
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
import {
  ref,
  watch,
  onMounted,
  computed,
  h,
  resolveComponent,
  nextTick,
  type VNode,
} from 'vue';
import { valueUpdater, getDataTypeFromValue } from '~/utils';
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
import ColumnFilter from '~/components/app/table/ColumnFilter.vue';

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
    default: 15,
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
  filterableColumns: {
    type: Array as PropType<(string | { id: string; headerColumn: string })[]>,
    default: () => [],
  },
  groupBy: {
    type: String as PropType<string | null>,
    default: null,
  },
  hideHeader: {
    type: Boolean,
    default: false,
  },
  externalSearch: {
    type: String as PropType<string | undefined>,
    default: undefined,
  },
});

const hasStats = ref(props.hasStats);
const hasSearch = ref(props.hasSearch);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { page } = useApp();
const menu = uselistMenus();

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

// always have search query
const getAutoColumn = (searchValue: string): string => {
  // const uuidRegex =
  //   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // if (uuidRegex.test(searchValue)) {
  //   return 'id';
  // }
  return 'search';
};

const groupDataByColumn = (items: DataItem[], columnId: string): DataItem[] => {
  const groups = new Map<string, DataItem[]>();
  for (const item of items) {
    const key = String(item[columnId] ?? '');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  const result: DataItem[] = [];
  for (const [, groupItems] of groups) {
    if (groupItems.length === 1) {
      result.push(groupItems[0]);
    } else {
      // First item is the parent (backend usually returns sorted by most recent)
      const parent = {
        ...groupItems[0],
        subRows: groupItems.slice(1),
        _versionCount: groupItems.length,
      };
      result.push(parent as DataItem);
    }
  }
  return result;
};

const isRefreshing = ref(false);

const fetchData = async () => {
  isRefreshing.value = true;
  const params: Record<string, unknown> = {
    page: currentPage.value,
    limit: pageSize.value,
    sort_order: (route.query.sort_order as string) || 'desc',
  };

  if (route.query.sort_by) {
    params.sort_by = route.query.sort_by as string;
  }

  const effectiveSearch = props.externalSearch ?? searchValue.value;
  if (route.query.q && route.query.column) {
    params[route.query.column as string] = route.query.q;
  } else if (effectiveSearch) {
    const filterColumn =
      (route.query.column as string) ||
      selectedFilterColumn.value ||
      getAutoColumn(effectiveSearch);
    params[getFilterColumnName(filterColumn)] = effectiveSearch;
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

  try {
    const response = await props.dataSource(params);

    if (response && 'data' in response && 'pagination' in response) {
      const tableData = response.data;
      const pagination = response.pagination;
      const rawData = (Array.isArray(tableData) ? tableData : []) as DataItem[];
      data.value = props.groupBy
        ? groupDataByColumn(rawData, props.groupBy)
        : rawData;

      if (pagination) {
        if (route.query.limit) {
          pageSize.value =
            parseInt(route.query.limit as string) || props.pageSize;
        } else {
          // Keep client default; don't overwrite with API's pagination.limit
          pageSize.value = props.pageSize;
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
  } finally {
    isRefreshing.value = false;
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
    query.sort_order = currentSortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    query.sort_by = columnId;
    query.sort_order = 'asc';
  }

  query.page = '1';
  currentPage.value = 1;

  router.replace({ query });
};

const handleColumnFilter = (columnId: string, values: (string | number)[]) => {
  const currentFilters = [...columnFilters.value];
  const existingFilterIndex = currentFilters.findIndex(
    (f) => f.id === columnId,
  );

  if (values.length === 0) {
    if (existingFilterIndex !== -1) {
      currentFilters.splice(existingFilterIndex, 1);
    }
  } else {
    const filter = {
      id: columnId,
      value: values,
    };
    if (existingFilterIndex !== -1) {
      currentFilters[existingFilterIndex] = filter;
    } else {
      currentFilters.push(filter);
    }
  }

  columnFilters.value = currentFilters;
};

const getValueLabel = (columnId: string, value: string | number): string => {
  if (columnId === 'data_source_type' && typeof value === 'number') {
    const typeName = getDataTypeFromValue(value);
    if (typeName) {
      return t(`label.${typeName}`);
    }
  }
  if (columnId === 'type' && typeof value === 'string') {
    return value;
  }
  if (columnId === 'ownership' && typeof value === 'string') {
    return t(`label.${value}`);
  }
  return String(value);
};

const getSectionIcon = (section: string | undefined) => {
  if (!section) return null;
  return menu.value.main.find((item) => item.key === section)?.icon;
};

const getColumns = (list: TableColumn[]) => {
  // Helper to check if a column has its own filter
  const isFilterable = (columnId: string) => {
    return props.filterableColumns.some((f) =>
      typeof f === 'string'
        ? f === columnId
        : f.id === columnId && !f.headerColumn,
    );
  };

  // Helper to get filters that should appear in a specific column's header
  const getFiltersForHeader = (headerColumnId: string) => {
    return props.filterableColumns.filter(
      (f) => typeof f === 'object' && f.headerColumn === headerColumnId,
    ) as { id: string; headerColumn: string }[];
  };

  return list.map((item) => {
    const isSortable = props.sortableColumns.includes(item.id);
    const columnIsFilterable = isFilterable(item.id);
    const additionalFilters = getFiltersForHeader(item.id);
    const hasFilters = columnIsFilterable || additionalFilters.length > 0;

    const headerContent = () => {
      const headerElements: VNode[] = [];

      if (isSortable) {
        const isSorted = currentSortBy.value === item.id;
        const sortOrder = isSorted ? currentSortOrder.value : null;

        headerElements.push(
          h(
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
          ),
        );
      } else {
        headerElements.push(h('span', t(`column.${item.id}`)));
      }

      // Add filter for this column's own data
      if (columnIsFilterable && table) {
        headerElements.push(
          h(ColumnFilter, {
            columnId: item.id,
            table: table,
            getValueLabel: (value: string | number) =>
              getValueLabel(item.id, value),
            onFilterChange: (colId: string, values: (string | number)[]) =>
              handleColumnFilter(colId, values),
          }),
        );
      }

      // Add filters from other columns that should appear in this header
      additionalFilters.forEach((filterConfig) => {
        if (table) {
          headerElements.push(
            h(ColumnFilter, {
              columnId: filterConfig.id,
              table: table,
              getValueLabel: (value: string | number) =>
                getValueLabel(filterConfig.id, value),
              onFilterChange: (colId: string, values: (string | number)[]) =>
                handleColumnFilter(colId, values),
            }),
          );
        }
      });

      return h(
        'div',
        {
          class: 'flex items-center gap-2',
        },
        headerElements,
      );
    };

    return {
      id: item.id,
      accessorKey: item.id,
      header: isSortable || hasFilters ? headerContent : t(`column.${item.id}`),
      cell: item.cell,
      enableHiding: item.enableHiding,
      size: item.size,
      minSize: item.minSize,
      maxSize: item.maxSize,
      meta: item.meta,
      filterFn: (row: unknown, columnId: string) => {
        const columnFilter = columnFilters.value.find((f) => f.id === columnId);
        if (
          !columnFilter ||
          !Array.isArray(columnFilter.value) ||
          columnFilter.value.length === 0
        ) {
          return true;
        }

        const rowObj = row as {
          original: DataItem;
          getValue: (columnId: string) => unknown;
        };
        const rowValue = rowObj.getValue
          ? rowObj.getValue(columnId)
          : (rowObj.original as DataItem)[columnId];

        if (rowValue === null || rowValue === undefined) {
          return false;
        }
        const normalizedRowValue =
          typeof rowValue === 'number' ? rowValue : String(rowValue);
        const matches = columnFilter.value.some((val) => {
          const normalizedVal = typeof val === 'number' ? val : String(val);
          return normalizedRowValue === normalizedVal;
        });

        return matches;
      },
    } as ColumnDef<DataItem>;
  });
};

const columns = ref<ColumnDef<DataItem>[]>(
  getColumns(props.columns ?? []) as ColumnDef<DataItem>[],
);

const table = useVueTable({
  data,
  get columns() {
    return columns.value;
  },
  getSubRows: props.groupBy
    ? (row: DataItem) => (row as DataItem & { subRows?: DataItem[] }).subRows
    : undefined,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onColumnFiltersChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, columnFilters);
    if (!isUpdatingFromState.value) {
      const searchFilter = columnFilters.value.find((f) => f.id === 'search');
      if (searchFilter) {
        updateUrlParams();
      }
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
  manualFiltering: false,
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

  currentPage.value = 1;
  query.page = '1';

  if (pageSize.value) {
    query.limit = pageSize.value.toString();
  }

  if (route.query.sort_order) {
    query.sort_order = route.query.sort_order as string;
  } else {
    query.sort_order = 'desc';
  }

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

const hasActiveColumnFilters = computed(() => {
  return columnFilters.value.some(
    (f) => f.id !== 'search' && Array.isArray(f.value) && f.value.length > 0,
  );
});

const clearAllColumnFilters = () => {
  columnFilters.value = columnFilters.value.filter((f) => f.id === 'search');
};

const add = () => {
  const section = page.value.section;
  switch (section) {
    case 'datasets':
      openAddDataset.value = true;
      break;
    case 'models':
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
  nextTick(() => {
    columns.value = getColumns(props.columns ?? []) as ColumnDef<DataItem>[];
  });
});

watch(
  () => data.value.length,
  () => {
    if (data.value.length > 0) {
      nextTick(() => {
        columns.value = getColumns(
          props.columns ?? [],
        ) as ColumnDef<DataItem>[];
      });
    }
  },
);

watch(
  () => props.columns,
  () => {
    columns.value = getColumns(props.columns ?? []) as ColumnDef<DataItem>[];
  },
  { deep: true },
);

watch(
  () => props.externalSearch,
  () => {
    if (props.hideHeader) fetchData();
  },
);

defineExpose({ fetchData, totalItems });
</script>

<template>
  <div :class="['w-full flex flex-col relative h-svh', props.class]">
    <div v-if="!props.hideHeader" class="pl-4 p-3">
      <div>
        <div class="pb-2 flex justify-between gap-2">
          <div>
            <h2 class="text-xl font-medium flex items-center gap-2">
              <Icon :name="getSectionIcon(page.section)" class="h-4 w-4 mr-2" />
              {{ t(`title.${page.section}`) }} ({{ totalItems || 0 }})
              <Button
                v-if="hasActiveColumnFilters"
                variant="ghost"
                size="sm"
                class="h-6 px-2 text-xs border border-border"
                @click="clearAllColumnFilters"
              >
                {{ t('action.clear_filters') }}
                <Icon name="lucide:x" class="ml-1 h-3 w-3" />
              </Button>
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

            <div class="flex gap-2 items-center">
              <slot name="header-actions" />

              <Button
                variant="outline"
                size="icon"
                class="cursor-pointer shrink-0"
                :title="t('action.refresh')"
                :disabled="isRefreshing"
                @click="fetchData()"
              >
                <Icon
                  name="lucide:refresh-cw"
                  :class="[
                    'h-4 w-4 transition-transform duration-300',
                    isRefreshing && 'animate-spin',
                  ]"
                />
              </Button>

              <Button class="cursor-pointer" @click="() => add()">
                <Icon name="lucide:plus" />
                {{ t(`action.add_${page.section}`) }}
              </Button>
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
    <div class="overflow-x-auto w-full flex-1">
      <table class="border-b w-full border-collapse table-fixed">
        <TableHeader
          class="sticky top-0 bg-muted/40 dark:bg-muted border-b border-t border-border z-10 shadow-xs"
        >
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers.filter(
                (h) => !(h.column.columnDef as any).meta?.hidden,
              )"
              :key="header.id"
              :class="'border-l border-r border-border py-1.5 px-3 text-sm'"
              :style="{
                width:
                  header.getSize() !== 150 ? `${header.getSize()}px` : 'auto',
              }"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getFilteredRowModel().rows?.length">
            <template
              v-for="row in table.getFilteredRowModel().rows"
              :key="row.id"
            >
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell
                  v-for="(cell, cellIndex) in row
                    .getVisibleCells()
                    .filter((c) => !(c.column.columnDef as any).meta?.hidden)"
                  :key="cell.id"
                  class="border-l border-r border-border py-1 px-3 text-sm"
                  :style="{
                    width:
                      cell.column.getSize() !== 150
                        ? `${cell.column.getSize()}px`
                        : 'auto',
                  }"
                >
                  <div
                    v-if="cellIndex === 0 && groupBy && row.getCanExpand()"
                    class="flex items-center gap-1.5"
                  >
                    <button
                      class="flex items-center justify-center size-5 rounded hover:bg-muted transition-colors cursor-pointer shrink-0"
                      @click="row.getToggleExpandedHandler()()"
                    >
                      <Icon
                        name="lucide:chevron-right"
                        :class="[
                          'size-3.5 transition-transform duration-200',
                          row.getIsExpanded() && 'rotate-90',
                        ]"
                      />
                    </button>
                    <FlexRender
                      :render="cell.column.columnDef.cell"
                      :props="cell.getContext()"
                    />
                    <span
                      v-if="(row.original as any)._versionCount > 1"
                      class="text-xs text-muted-foreground ml-1"
                    >
                      ({{ (row.original as any)._versionCount }})
                    </span>
                  </div>
                  <FlexRender
                    v-else
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
              <!-- Sub-rows when expanded -->
              <template
                v-if="groupBy && row.getIsExpanded() && row.subRows?.length"
              >
                <TableRow
                  v-for="subRow in row.subRows"
                  :key="subRow.id"
                  class="bg-muted/20"
                >
                  <TableCell
                    v-for="(cell, cellIndex) in subRow
                      .getVisibleCells()
                      .filter((c) => !(c.column.columnDef as any).meta?.hidden)"
                    :key="cell.id"
                    class="border-l border-r border-border py-1 px-3 text-sm"
                    :style="{
                      width:
                        cell.column.getSize() !== 150
                          ? `${cell.column.getSize()}px`
                          : 'auto',
                    }"
                  >
                    <div v-if="cellIndex === 0" class="pl-6">
                      <FlexRender
                        :render="cell.column.columnDef.cell"
                        :props="cell.getContext()"
                      />
                    </div>
                    <FlexRender
                      v-else
                      :render="cell.column.columnDef.cell"
                      :props="cell.getContext()"
                    />
                  </TableCell>
                </TableRow>
              </template>
              <!-- Default expanded row (non-grouped) -->
              <TableRow v-if="!groupBy && row.getIsExpanded()">
                <TableCell
                  :colspan="row.getAllCells().length"
                  class="border-l border-r border-border py-1 px-3 text-sm"
                >
                  {{ JSON.stringify(row.original) }}
                </TableCell>
              </TableRow>
            </template>
          </template>

          <TableRow v-else>
            <TableCell
              :colspan="columns.length"
              class="h-64 border-l border-r border-border"
            >
              <div class="flex flex-col items-center justify-center gap-3 py-8">
                <div
                  class="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50"
                >
                  <Icon
                    name="lucide:inbox"
                    class="w-8 h-8 text-muted-foreground/60"
                  />
                </div>
                <div class="flex flex-col items-center gap-1">
                  <p class="text-base font-medium text-foreground">
                    {{ t('hint.no_results') }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ t('hint.no_results_description') }}
                  </p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </table>
    </div>

    <div
      class="py-1 px-4 border-t border-border bg-card absolute bottom-0 left-0 right-0"
    >
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
          :page-size-options="[5, 10, 15, 20, 50, 100]"
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
