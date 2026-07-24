<script setup lang="ts">
import type { DatasetTypeStat } from '~/composables/useDashboard';

defineProps<{
  stats: DatasetTypeStat[];
  total: number;
  loading: boolean;
  error: boolean;
}>();
</script>

<template>
  <div class="rounded-xl border border-border/60 bg-card flex flex-col">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/50">
      <div class="flex items-center gap-2">
        <Icon name="lucide:table-2" class="size-4 text-muted-foreground" />
        <span class="text-sm font-medium">Dataset Inventory</span>
      </div>
      <span class="text-xs text-muted-foreground">Total: {{ total }}</span>
    </div>
    <div class="flex-1 px-4 py-3 space-y-2 pb-4">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="flex items-center justify-between">
          <span class="h-3 w-20 rounded bg-muted animate-pulse" />
          <span class="h-3 w-8 rounded bg-muted animate-pulse" />
        </div>
      </template>
      <template v-else-if="error">
        <p class="text-xs text-muted-foreground py-4 text-center">
          <Icon name="lucide:triangle-alert" class="size-4 inline mr-1 text-red-500" />
          Failed to load datasets
        </p>
      </template>
      <template v-else-if="stats.length === 0">
        <p class="text-xs text-muted-foreground py-4 text-center">No datasets registered</p>
      </template>
      <template v-else>
        <div
          v-for="stat in stats"
          :key="stat.type"
          class="flex items-center justify-between py-1"
        >
          <span class="flex items-center gap-2 text-sm capitalize">
            <Icon :name="stat.icon" class="size-4" :class="stat.colorClass" />
            {{ stat.type.replace('_', ' ') }}
          </span>
          <span class="text-sm font-semibold">{{ stat.count }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
