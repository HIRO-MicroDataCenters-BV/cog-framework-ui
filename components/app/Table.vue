<script setup lang="ts">
import type {
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
  ColumnDef,
  Row,
} from '@tanstack/vue-table';
import { valueUpdater } from '~/utils';
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { h, ref } from 'vue';
import { AppMenuActions } from '#components';

interface DataItem {
  id: string;
  name: string;
  description: string;
  status: string;
  type: string;
  last_update: string;
}

const type = 'default';

const { t } = useI18n();
const data = useMock();
const dayjs = useDayjs();
const actions = useListActions(type);
const hasTableFilters = ref(true);
const toggleTableFilters = () => {
  hasTableFilters.value = !hasTableFilters.value;
};

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
    header: 'Status',
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

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref<Record<string, boolean>>({});
const expanded = ref<ExpandedState>({});

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
  },
});

const tabs = uselistTabs();

const openAddDataset = ref(false);

const addDataSet = () => {
  openAddDataset.value = true;
};
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

    <!-- table filters-->
    <div v-if="hasTableFilters">
      <Separator />
      <div class="flex gap-2 items-center py-4">
        <div class="flex-auto flex">
          <div class="flex gap-2">
            <Input
              class="w-64"
              type="search"
              :placeholder="t('placeholder.search')"
              v
              :model-value="table.getColumn('name')?.getFilterValue() as string"
              @update:model-value="
                table.getColumn('name')?.setFilterValue($event)
              "
            />

            <Select default-value="all">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Select a fruit" />
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
    <!-- end table filters-->
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
