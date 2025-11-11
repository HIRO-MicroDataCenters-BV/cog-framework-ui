<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';
import type { DataItem } from '~/types/table.types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '~/components/ui/dropdown-menu';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Checkbox } from '~/components/ui/checkbox';

interface FilterOption {
  value: string | number;
  label: string;
  count: number;
}

const props = defineProps<{
  columnId: string;
  table: Table<DataItem>;
  getValueLabel?: (value: string | number) => string;
}>();

const emit = defineEmits<{
  'filter-change': [columnId: string, values: (string | number)[]];
}>();

const { t } = useI18n();
const isOpen = ref(false);
const selectedValues = ref<Set<string | number>>(new Set());

const filterOptions = computed<FilterOption[]>(() => {
  const allRows = props.table.getCoreRowModel().rows;
  const valueCounts = new Map<string | number, number>();

  allRows.forEach((row) => {
    const value = (row.original as Record<string, unknown>)[props.columnId];
    if (value !== null && value !== undefined) {
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    }
  });

  return Array.from(valueCounts.entries())
    .map(([value, count]) => ({
      value,
      label: props.getValueLabel
        ? props.getValueLabel(value)
        : String(value),
      count,
    }))
    .sort((a, b) => b.count - a.count);
});

watch(
  () => props.table.getState().columnFilters,
  (filters) => {
    const columnFilter = filters.find((f) => f.id === props.columnId);
    if (columnFilter) {
      if (Array.isArray(columnFilter.value)) {
        selectedValues.value = new Set(columnFilter.value);
      } else {
        selectedValues.value = new Set();
      }
    } else {
      selectedValues.value = new Set();
    }
  },
  { immediate: true },
);

const selectedCount = computed(() => selectedValues.value.size);

const toggleValue = (value: string | number, checked: boolean) => {
  if (checked) {
    selectedValues.value.add(value);
  } else {
    selectedValues.value.delete(value);
  }
  applyFilter();
};

const handleItemClick = (value: string | number) => {
  const isCurrentlySelected = selectedValues.value.has(value);
  toggleValue(value, !isCurrentlySelected);
};

const clearAll = () => {
  selectedValues.value.clear();
  applyFilter();
};

const applyFilter = () => {
  const values = Array.from(selectedValues.value);
  emit('filter-change', props.columnId, values);
};

const isSelected = (value: string | number) => {
  return selectedValues.value.has(value);
};
</script>

<template>
  <DropdownMenu v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="h-6 w-6 p-0 hover:bg-muted"
        @click.stop
      >
        <Icon
          v-if="selectedCount === 0"
          name="lucide:filter"
          class="h-4 w-4 text-muted-foreground"
        />
        <Badge
          v-else
          variant="secondary"
          class="h-5 min-w-5 px-0 rounded-full bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center text-xs"
        >
          {{ selectedCount }}
        </Badge>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      class="w-56 max-h-[300px] overflow-y-auto"
    >
      <div class="max-h-[200px] overflow-y-auto">
        <DropdownMenuItem
          v-for="option in filterOptions"
          :key="String(option.value)"
          class="cursor-pointer"
          @click.prevent.stop="() => handleItemClick(option.value)"
        >
          <div class="flex items-center gap-2 w-full">
            <div @click.stop="() => handleItemClick(option.value)">
              <Checkbox :checked="isSelected(option.value)" />
            </div>
            <div class="flex items-center justify-between flex-1">
              <span>{{ option.label }}</span>
              <span class="text-xs text-muted-foreground ml-2">
                ({{ option.count }})
              </span>
            </div>
          </div>
        </DropdownMenuItem>
      </div>
      <DropdownMenuSeparator v-if="selectedCount > 0" />
      <DropdownMenuItem
        v-if="selectedCount > 0"
        @click="clearAll"
      >
        {{ t('action.clear_all') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

