<script setup lang="ts">
import type {
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
  ColumnDef,
  Row,
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
import { h, ref, watch, onMounted } from 'vue';
import { valueUpdater } from '~/utils';
import { AppMenuActions } from '#components';
import type { DataItem, SearchFilter } from '~/types/table.types';

const type = 'default';

const { t } = useI18n();
const data = useMock();
const dayjs = useDayjs();
const actions = useListActions(type);
const api = useApi();
const hasTableFilters = ref(true);
const toggleTableFilters = () => {
  hasTableFilters.value = !hasTableFilters.value;
};

// Состояние для хранения выбранной колонки фильтрации
const selectedFilterColumn = ref('all');
// Состояние для хранения значения поиска
const searchValue = ref('');

const columns: ColumnDef<DataItem>[] = [
  /*
  NOTE: If you want to use the select column, you need to add the following code:
  {
    id: 'select',
    header: ({ table }) =>
      h(Checkbox, {
        checked:
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate'),
        'onUpdate:checked': (value: boolean) =>
          table.toggleAllPageRowsSelected(!!value),
      }),
    cell: ({ row }: { row: Row<DataItem> }) =>
      h(Checkbox, {
        checked: row.getIsSelected(),
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
      }),
    enableSorting: false,
    enableHiding: false,
  },
  */
  {
    accessorKey: 'id',
    header: t('column.id'),
    cell: ({ row }: { row: Row<DataItem> }) =>
      h('div', { class: '' }, row.getValue('id')),
  },
  {
    accessorKey: 'name',
    header: t('column.name'),
    cell: ({ row }: { row: Row<DataItem> }) =>
      h('div', { class: '' }, row.getValue('name')),
  },
  {
    accessorKey: 'description',
    header: t('column.description'),
    cell: ({ row }: { row: Row<DataItem> }) =>
      h('div', { class: '' }, row.getValue('description')),
  },
  {
    accessorKey: 'status',
    header: t('column.status'),
    cell: ({ row }: { row: Row<DataItem> }) =>
      h('div', { class: 'capitalize' }, row.getValue('status')),
  },
  {
    accessorKey: 'type',
    header: t('column.type'),
    cell: ({ row }: { row: Row<DataItem> }) =>
      h('div', { class: 'capitalize' }, row.getValue('type')),
  },
  {
    accessorKey: 'last_update',
    header: t('column.last_update'),
    cell: ({ row }: { row: Row<DataItem> }) =>
      h(
        'div',
        { class: 'relative' },
        dayjs(row.getValue('last_update')).format('DD/MM/YYYY'),
      ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }: { row: Row<DataItem> }) => {
      const id = Number(row.getValue('id'));
      return h(
        'div',
        { class: 'relative' },
        h(AppMenuActions, {
          id,
          items: actions.value,
          onExpand: () => row.toggleExpanded(),
        }),
      );
    },
  },
];

// Используем useRoute и useRouter для работы с URL-параметрами
const route = useRoute();
const router = useRouter();

// Инициализируем состояние таблицы из URL-параметров или используем значения по умолчанию
const sorting = ref<SortingState>(
  route.query.sort
    ? JSON.parse(decodeURIComponent(route.query.sort as string))
    : [],
);
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

// Текущая страница пагинации
const currentPage = ref<number>(
  route.query.page ? parseInt(route.query.page as string) : 0,
);

const table = useVueTable({
  data: data.value.data as unknown as DataItem[],
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, expanded),
  manualPagination: false,
  // Добавляем глобальную функцию фильтрации
  globalFilterFn: (row, columnId, filterValue) => {
    // Получаем информацию о фильтре из состояния
    const searchFilter = columnFilters.value.find(
      (filter) => filter.id === 'search',
    ) as SearchFilter | undefined;
    if (!searchFilter) return true;

    // Если выбрана конкретная колонка и это не текущая колонка, пропускаем фильтрацию
    if (searchFilter.column !== 'all' && searchFilter.column !== columnId) {
      return true;
    }

    // Получаем значение ячейки
    const value = row.getValue(columnId);
    // Если значение не строка, преобразуем его в строку
    const valueStr = String(value).toLowerCase();
    // Проверяем, содержит ли значение ячейки строку поиска
    return valueStr.includes(String(searchFilter.value).toLowerCase());
  },
  // Устанавливаем начальную страницу из URL-параметров
  initialState: {
    pagination: {
      pageIndex: currentPage.value,
      pageSize: 10,
    },
  },
  onPaginationChange: (updater) => {
    const newPagination =
      typeof updater === 'function'
        ? updater(table.getState().pagination)
        : updater;
    currentPage.value = newPagination.pageIndex;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
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
        pageSize: 10,
      };
    },
  },
});

const tabs = uselistTabs();

const openAddDataset = ref(false);

const addDataSet = () => {
  openAddDataset.value = true;
};

// Функция для применения фильтра поиска в зависимости от выбранной колонки
const applySearchFilter = () => {
  // Обновляем состояние columnFilters
  // Удаляем предыдущий поисковый фильтр, если он был
  columnFilters.value = columnFilters.value.filter(
    (filter) => filter.id !== 'search',
  );

  // Если поле поиска пустое, не применяем фильтры
  if (!searchValue.value) {
    return;
  }

  // Создаем новый фильтр с информацией о поиске
  const searchFilter: SearchFilter = {
    id: 'search',
    value: searchValue.value,
    column: selectedFilterColumn.value,
  };

  // Добавляем фильтр в состояние
  columnFilters.value.push(searchFilter as any);
};

// Функция для обновления URL-параметров на основе состояния таблицы
const updateUrlParams = () => {
  // Если уже идет обновление из URL, пропускаем обновление URL из состояния
  if (isUpdatingFromState) return;

  const query: Record<string, string> = {};

  // Добавляем параметры только если они не пустые
  if (sorting.value.length > 0) {
    query.sort = encodeURIComponent(JSON.stringify(sorting.value));
  }

  if (columnFilters.value.length > 0) {
    query.filters = encodeURIComponent(JSON.stringify(columnFilters.value));
  }

  if (Object.keys(columnVisibility.value).length > 0) {
    query.visibility = encodeURIComponent(
      JSON.stringify(columnVisibility.value),
    );
  }

  if (currentPage.value > 0) {
    query.page = currentPage.value.toString();
  }

  // Устанавливаем флаг, чтобы избежать повторного обновления из URL
  isUpdatingFromState = true;

  // Обновляем URL без перезагрузки страницы
  router.replace({ query }).then(() => {
    // Сбрасываем флаг после обновления URL
    setTimeout(() => {
      isUpdatingFromState = false;
    }, 100); // Увеличиваем задержку для более надежной работы
  });
};

// Следим за изменениями состояния таблицы и обновляем URL
watch(
  [sorting, columnFilters, columnVisibility, currentPage],
  () => {
    updateUrlParams();
  },
  { deep: true },
);

// Переменная для предотвращения циклических обновлений
let isUpdatingFromState = false;

// Следим за изменениями URL и обновляем состояние таблицы
watch(
  () => route.query,
  (newQuery) => {
    // Пропускаем обновление, если изменения были вызваны из компонента
    if (isUpdatingFromState) return;

    // Устанавливаем флаг, чтобы избежать циклического обновления
    isUpdatingFromState = true;

    try {
      // Обрабатываем параметр сортировки
      if (newQuery.sort) {
        sorting.value = JSON.parse(decodeURIComponent(newQuery.sort as string));
      } else {
        sorting.value = [];
      }

      // Обрабатываем параметр фильтров
      if (newQuery.filters) {
        columnFilters.value = JSON.parse(
          decodeURIComponent(newQuery.filters as string),
        );

        // Извлекаем значение поиска и выбранную колонку из параметров фильтра
        const filters = columnFilters.value;
        if (filters.length > 0) {
          // Проверяем, есть ли фильтр с id 'search'
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

      // Обрабатываем параметр видимости колонок
      if (newQuery.visibility) {
        columnVisibility.value = JSON.parse(
          decodeURIComponent(newQuery.visibility as string),
        );
      } else {
        columnVisibility.value = {};
      }

      // Обрабатываем параметр страницы
      if (newQuery.page) {
        const pageIndex = parseInt(newQuery.page as string);
        currentPage.value = pageIndex;
        table.setPageIndex(pageIndex);
      } else {
        currentPage.value = 0;
        table.setPageIndex(0);
      }
    } catch (error) {
      console.error('Ошибка при обработке URL-параметров:', error);
      // В случае ошибки сбрасываем состояние таблицы к значениям по умолчанию
      sorting.value = [];
      columnFilters.value = [];
      columnVisibility.value = {};
      currentPage.value = 0;
      table.setPageIndex(0);
    } finally {
      // Сбрасываем флаг после обновления состояния
      setTimeout(() => {
        isUpdatingFromState = false;
      }, 100);
    }
  },
  { deep: true },
);

// При монтировании компонента инициализируем URL, если параметры не заданы
onMounted(() => {
  // Небольшая задержка для инициализации компонента
  setTimeout(() => {
    if (Object.keys(route.query).length === 0) {
      updateUrlParams();
    }
  }, 50);
});
</script>

<template>
  <div class="w-full">
    <div>
      <h1 class="text-lg font-semibold mb-4">
        {{ t('subtitle.datasets') }}
      </h1>
      <div class="pb-4 flex">
        <div class="flex-auto">
          <div class="frame grid gap-4 auto-cols-max grid-flow-col">
            <div v-for="item in data.stat" :key="item.key" class="frame-item">
              <div
                class="frame-item-label uppercase text-zinc-500 mb-2 text-sm"
              >
                {{ item.label }}
              </div>
              <div class="frame-item-content flex items-center">
                <Icon :name="item.icon" :class="`h-4 w-4 mr-2 ${item.color}`" />
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
              class="w-64"
              type="search"
              :placeholder="t('placeholder.search')"
              v-model="searchValue"
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
    <!-- end table filters -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
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

    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ table.getFilteredSelectedRowModel().rows.length }}
        {{ t('hint.of') }} {{ table.getFilteredRowModel().rows.length }}
        {{ t('hint.rows_selected') }}
      </div>
      <div class="space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <Icon name="lucide:chevron-left" />
          <span>{{ t('action.previous') }}</span>
        </Button>
        <span class="mx-2">
          {{ t('hint.page') }} {{ table.getState().pagination.pageIndex + 1 }}
          {{ t('hint.of') }} {{ table.getPageCount() }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span>{{ t('action.next') }}</span>
          <Icon name="lucide:chevron-right" />
        </Button>
      </div>
    </div>
  </div>
  <AppDialogDataset
    :open="openAddDataset"
    @on-close="() => (openAddDataset = false)"
  />
</template>
