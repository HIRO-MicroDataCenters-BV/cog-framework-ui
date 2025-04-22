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
import { ref, watch, onMounted } from 'vue';
import { valueUpdater } from '~/utils';
/*
import { AppMenuActions } from '#components';
*/
import type {
  SearchFilter,
  SearchFilterParams,
  TableColumn,
  TableDataResponse,
  DataItem,
} from '~/types/table.types';

const props = defineProps({
  dataSource: {
    type: Function as PropType<(params: unknown) => Promise<TableDataResponse>>,
    required: true,
  },
  columns: Array as PropType<TableColumn[]>,
  pageSize: {
    type: Number,
    default: 10,
  },
});

const mock = useMock();

const { t } = useI18n();
const data = shallowRef<DataItem[]>([]);
const totalItems = ref(0);
const pageSize = ref(props.pageSize);

const hasTableFilters = ref(true);
const fetchData = async () => {
  const params: Record<string, any> = {
    page: table.getState().pagination.pageIndex + 1,
    limit: pageSize.value,
  };

  if (route.query.q && route.query.column) {
    params[route.query.column as string] = route.query.q;
  } else if (searchValue.value && selectedFilterColumn.value) {
    params[selectedFilterColumn.value] = searchValue.value;
  }

  if (route.query.page) {
    params.page = parseInt(route.query.page as string);
  }
  if (route.query.limit) {
    params.limit = parseInt(route.query.limit as string);
  }

  const { data: tableData, pagination } = await props.dataSource(params);
  data.value = tableData ?? [];
  pageSize.value = pagination?.limit ?? 0;
  totalItems.value = pagination?.total_items ?? 0;

  if (pagination) {
    const totalPages = Math.ceil(totalItems.value / pageSize.value) || 1;
    table.setPageSize(pageSize.value);
    if (currentPage.value >= totalPages) {
      table.setPageIndex(currentPage.value);
    }
  }
};

const toggleTableFilters = () => {
  hasTableFilters.value = !hasTableFilters.value;
};

const selectedFilterColumn = ref('all');
const searchValue = ref('');

const stat = ref(mock.value.stat);

const route = useRoute();
const router = useRouter();

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
  route.query.page ? parseInt(route.query.page as string) : 0,
);

const getColumns = (list: TableColumn[]) => {
  return list.map((item) => {
    return {
      id: item.id,
      accessorKey: item.id,
      header: t(`column.${item.id}`),
      cell: item.cell,
    };
  });
};

const columns = ref(getColumns(props.columns ?? []));
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
      pageIndex: currentPage.value,
      pageSize: pageSize.value,
    },
  },

  onPaginationChange: (updater) => {
    const newPagination =
      typeof updater === 'function'
        ? updater(table.getState().pagination)
        : updater;

    if (newPagination.pageIndex !== currentPage.value) {
      currentPage.value = newPagination.pageIndex;
      const query = { ...route.query };
      query.page = currentPage.value.toString();
      router.replace({
        query,
      });
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
        pageIndex: currentPage.value,
        pageSize: pageSize.value,
      };
    },
  },
});

const tabs = uselistTabs();

const openAddDataset = ref(false);
const isUpdatingFromState = ref(false);

const addDataSet = () => {
  openAddDataset.value = true;
};
const applySearchFilter = () => {
  columnFilters.value = columnFilters.value.filter(
    (filter) => filter.id !== 'search',
  );
  if (!searchValue.value) {
    updateUrlParams();
    return;
  }
  const searchFilter: SearchFilter = {
    id: 'search',
    value: searchValue.value,
    column: selectedFilterColumn.value,
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
  query.page = (currentPage.value + 1).toString();

  if (pageSize.value) {
    query.limit = pageSize.value.toString();
    table.setPageSize(pageSize.value);
  }
  isUpdatingFromState.value = true;
  router.replace({ query }).then(() => {
    setTimeout(() => {
      isUpdatingFromState.value = false;
    }, 100);
    fetchData();
  });
};

const setPage = (page: number) => {
  currentPage.value = page;
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
        table.setPageIndex(pageIndex);
      } else {
        currentPage.value = 0;
        table.setPageIndex(0);
      }

      if (newQuery.limit) {
        const pageSize = parseInt(newQuery.limit as string);
        if (pageSize > 0 && pageSize !== props.pageSize) {
          table.setPageSize(pageSize);
        }
      }
    } catch (error) {
      columnFilters.value = [];
      columnVisibility.value = {};
      currentPage.value = 0;
      table.setPageIndex(0);
    } finally {
      setTimeout(() => {
        isUpdatingFromState.value = false;
        fetchData();
      }, 100);
    }
  },
  { deep: true },
);

onMounted(() => {
  fetchData();
  setTimeout(() => {
    if (Object.keys(route.query).length === 0) {
      updateUrlParams();
    }
  }, 50);
});
</script>

<template>
  <div class="w-full flex flex-col" style="height: calc(100vh - 80px)">
    <div class="p-4">
      <div>
        <div class="pb-4 flex">
          <div class="flex-auto">
            <div class="frame grid gap-4 auto-cols-max grid-flow-col">
              <div v-for="item in stat" :key="item.key" class="frame-item">
                <div
                  class="frame-item-label uppercase text-zinc-500 mb-2 text-sm"
                >
                  {{ item.label }}
                </div>
                <div class="frame-item-content flex items-center">
                  <Icon
                    :name="item.icon"
                    :class="`h-4 w-4 mr-2 ${item.color}`"
                  />
                  <span class="stat-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-6 items-center">
            <div class="flex gap-2">
              <Switch
                :model-value="hasTableFilters"
                @update:model-value="toggleTableFilters"
              />
              <Label class="flex items-center">{{ t('label.filters') }}</Label>
            </div>
            <Button @click="() => addDataSet()">{{
              t('action.add_dataset')
            }}</Button>
          </div>
        </div>
      </div>

      <!-- table filters -->
      <div v-if="hasTableFilters">
        <Separator />
        <div class="flex gap-2 items-center py-4">
          <div class="flex-auto flex">
            <div class="flex gap-2">
              <Input
                v-model="searchValue"
                class="w-64"
                type="search"
                :placeholder="t('placeholder.search')"
                @update:model-value="applySearchFilter"
              />

              <Select
                v-model="selectedFilterColumn"
                @update:model-value="applySearchFilter"
              >
                <SelectTrigger class="w-[180px]">
                  <SelectValue :placeholder="t('placeholder.select_filter')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{{ t('title.select_filter') }}</SelectLabel>
                    <SelectItem value="all"
                      >{{ t('hint.in') }} {{ t('hint.all') }}</SelectItem
                    >
                    <SelectItem
                      v-for="column in table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())"
                      :key="column.id"
                      :value="column.id"
                    >
                      {{ t('hint.in') }} {{ t(`column.${column.id}`) }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="flex gap-2">
            <Tabs default-value="all">
              <TabsList class="flex">
                <TabsTrigger
                  v-for="item in tabs.dataset_management"
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
    </div>
    <!-- end table filters -->
    <div class="flex-grow overflow-auto flex flex-col">
      <Table class="border-b">
        <TableHeader class="sticky top-0 bg-sidebar-background">
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
        <div class="flex-1 text-sm text-muted-foreground">
          {{ table.getFilteredSelectedRowModel().rows.length }}
          {{ t('hint.of') }} {{ table.getFilteredRowModel().rows.length }}
          {{ t('hint.rows_selected') }}
        </div>
        {{ currentPage }}
        <AppTablePagination
          :current-page="currentPage"
          :total-items="Math.ceil(totalItems / pageSize)"
          :page-size="table.getPageCount()"
          :can-previous-page="table.getCanPreviousPage()"
          :can-next-page="table.getCanNextPage()"
          @on-set-page="
            (page) => {
              table.setPageIndex(page);
            }
          "
        />
      </div>
    </div>
  </div>
  <AppDialogDataset
    :open="openAddDataset"
    @on-close="() => (openAddDataset = false)"
  />
</template>
