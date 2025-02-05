<script setup lang="ts">
import type {
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { valueUpdater } from '~/utils'
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { h, ref } from 'vue'
//import DropdownActions from './menu/actions.vue'

const { t } = useI18n()
const data = useMock()
const dayjs = useDayjs()

const columns = [
  {
    id: 'select',
    header: ({ table }) => h(Checkbox, {
      'checked': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
      'onUpdate:checked': value => table.toggleAllPageRowsSelected(!!value),
    }),
    cell: ({ row }) => h(Checkbox, {
      'checked': row.getIsSelected(),
      'onUpdate:checked': value => row.toggleSelected(!!value),
    }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: t('column.name'),
    cell: ({ row }) => h('div', { class: '' }, row.getValue('name')),
  },
  {
    accessorKey: 'description',
    header: t('column.description'),
    cell: ({ row }) => h('div', { class: '' }, row.getValue('description')),
  },

  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('status')),
  },
  {
    accessorKey: 'type',
    header: t('column.type'),
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('type')),
  },
  {
    accessorKey: 'last_update',
    header: t('column.last_update'),
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('last_update')),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => h('div', { class: 'capitalize' }, dayjs(row.getValue('last_update')).format('DD/MM/YYYY')),
    /*
    cell: ({ row }) => {
      
      const payment = row.original
      return h('div', { class: 'relative' }, h(DropdownActions, {
        payment,
        onExpand: row.toggleExpanded,
      }))
      
    },
    */
  },
]

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const expanded = ref<ExpandedState>({})

const table = useVueTable({
  data: data.value.data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
    get expanded() { return expanded.value },
  },
})

const tabs = uselistTabs()
</script>

<template>
  <div class="w-full">
    <div>
      <h1 class="text-lg font-semibold mb-4">
        {{ $t('subtitle.datasets') }}
      </h1>
      <div class="frame grid gap-4 auto-cols-max grid-flow-col">
        <div v-for="item in data.stat" :key="item.key" class="frame-item">
          <div class="frame-item-label uppercase text-zinc-500 mb-2 text-sm">
            {{ item.label }}
          </div>
          <div class="frame-item-content flex items-center">
            <Icon :name="item.icon" :class="`h-4 w-4 mr-2 ${item.color}`" />
            <span class="stat-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex gap-2 items-center py-4">
      <div class="flex-auto">
        <Input class="w-64" type="search" :placeholder="$t('placeholder.search')" v
          :model-value="table.getColumn('name')?.getFilterValue() as string"
          @update:model-value=" table.getColumn('name')?.setFilterValue($event)" />
      </div>
      <div class="flex gap-2">
        <Tabs default-value="all">
          <TabsList class="flex">
            <TabsTrigger v-for="item in tabs.dataset_management" :key="item.key" :value="item.value">
              <div class="flex items-center">
                <Icon v-if="item.icon" :name="item.icon" class="h-4 w-4 mr-2" />
                <span>{{ item.title }}</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="ml-auto">
              {{ $t('action.filters') }}
              <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
              :key="column.id" class="capitalize" :checked="column.getIsVisible()" @update:checked="(value) => {
                column.toggleVisibility(!!value)
              }">
              {{ column.id }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header"
                :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
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
              {{ $t('hint.no_results') }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ table.getFilteredSelectedRowModel().rows.length }} {{ $t('hint.of') }}
        {{ table.getFilteredRowModel().rows.length }} {{ $t('hint.rows_selected') }}
      </div>
      <div class="space-x-2">
        <Button variant="outline" size="sm" :disabled="!table.getCanPreviousPage()" @click="table.previousPage()">
          <Icon name="lucide:chevron-left" />
          <span>{{ $t('action.previous') }}</span>
        </Button>
        <Button variant="outline" size="sm" :disabled="!table.getCanNextPage()" @click="table.nextPage()">
          <span>{{ $t('action.next') }}</span>
          <Icon name="lucide:chevron-right" />
        </Button>
      </div>
    </div>
  </div>
</template>
