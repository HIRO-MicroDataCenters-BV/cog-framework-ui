<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { Table } from '@tanstack/vue-table';
import type { DataItem } from '~/types/table.types';
import { Check } from 'lucide-vue-next';
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

const normalizeValue = (value: string | number): string | number => {
  if (typeof value === 'number') return value;
  return String(value);
};

const filterOptions = computed<FilterOption[]>(() => {
  const allRows = props.table.getCoreRowModel().rows;
  const valueCounts = new Map<string | number, number>();

  allRows.forEach((row) => {
    const value = (row.original as Record<string, unknown>)[props.columnId];
    if (value !== null && value !== undefined) {
      const normalizedValue = normalizeValue(
        typeof value === 'number' ? value : String(value),
      );
      valueCounts.set(
        normalizedValue,
        (valueCounts.get(normalizedValue) || 0) + 1,
      );
    }
  });

  return Array.from(valueCounts.entries())
    .map(([value, count]) => ({
      value,
      label: props.getValueLabel ? props.getValueLabel(value) : String(value),
      count,
    }))
    .sort((a, b) => b.count - a.count);
});

const syncSelectedValues = () => {
  const filters = props.table.getState().columnFilters;
  const columnFilter = filters.find((f) => f.id === props.columnId);
  if (columnFilter && Array.isArray(columnFilter.value) && columnFilter.value.length > 0) {
    const filterValues = columnFilter.value.map(normalizeValue);
    selectedValues.value = new Set(filterValues);
  } else {
    selectedValues.value = new Set();
  }
};

watch(
  () => props.table.getState().columnFilters,
  () => {
    syncSelectedValues();
  },
  { immediate: true, deep: true },
);

watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      syncSelectedValues();
    }
  },
);

const selectedCount = computed(() => selectedValues.value.size);

const toggleValue = (value: string | number, checked: boolean) => {
  const normalizedValue = normalizeValue(value);
  if (checked) {
    selectedValues.value.add(normalizedValue);
  } else {
    selectedValues.value.delete(normalizedValue);
  }
  applyFilter();
};

const handleItemClick = (value: string | number) => {
  const normalizedValue = normalizeValue(value);
  const isCurrentlySelected = selectedValues.value.has(normalizedValue);
  toggleValue(normalizedValue, !isCurrentlySelected);
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
  const normalizedValue = normalizeValue(value);
  return selectedValues.value.has(normalizedValue);
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
        >
          <div class="flex items-center gap-2 w-full">
            <Checkbox
              :model-value="isSelected(option.value)"
              @update:model-value="(checked) => toggleValue(option.value, checked)"
              @click.stop
            >
              <template #default>
                <Check class="size-3.5 text-white" />
              </template>
            </Checkbox>
            <div
              class="flex items-center justify-between flex-1"
              @click.stop="() => handleItemClick(option.value)"
            >
              <span>{{ option.label }}</span>
              <span class="text-xs text-muted-foreground ml-2">
                ({{ option.count }})
              </span>
            </div>
          </div>
        </DropdownMenuItem>
      </div>
      <DropdownMenuSeparator v-if="selectedCount > 0" />
      <DropdownMenuItem v-if="selectedCount > 0" @click="clearAll">
        {{ t('action.clear_all') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>