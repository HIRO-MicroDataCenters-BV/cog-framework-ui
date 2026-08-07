<script setup lang="ts">
import type { GrowthPoint } from '~/composables/useDashboard';

const props = defineProps<{
  series: GrowthPoint[];
  loading: boolean;
  error: boolean;
}>();

const seriesDefs = [
  {
    key: 'models' as const,
    label: 'Models',
    bar: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'datasets' as const,
    label: 'Datasets',
    bar: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
  },
];

const maxVal = computed(() =>
  Math.max(1, ...props.series.flatMap((p) => [p.models, p.datasets])),
);

// Cap at 82% so the value label above the tallest bar always has headroom.
function barHeight(v: number): string {
  if (v <= 0) return '0%';
  return `${Math.max(6, Math.round((v / maxVal.value) * 82))}%`;
}

// Hovering a bar or legend entry highlights that series and dims the other.
const hoveredKey = ref<string | null>(null);
function dimClass(key: string): string {
  return hoveredKey.value && hoveredKey.value !== key
    ? 'opacity-30'
    : 'opacity-100';
}
</script>

<template>
  <div class="rounded-xl border border-border/60 bg-card flex flex-col">
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-border/50"
    >
      <div class="flex items-center gap-2">
        <Icon name="lucide:trending-up" class="size-4 text-teal-500" />
        <span class="text-sm font-medium"
          >Registration trend · last 6 months</span
        >
      </div>
      <div class="flex items-center gap-3">
        <span
          v-for="d in seriesDefs"
          :key="d.key"
          class="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-default transition-opacity"
          :class="dimClass(d.key)"
          @mouseenter="hoveredKey = d.key"
          @mouseleave="hoveredKey = null"
        >
          <span class="size-2 rounded-full" :class="d.bar" />
          {{ d.label }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-end gap-4 px-5 py-5 h-[190px]">
      <span
        v-for="i in 6"
        :key="i"
        class="flex-1 rounded bg-muted animate-pulse"
        :style="{ height: `${30 + (i % 3) * 20}%` }"
      />
    </div>

    <p
      v-else-if="error"
      class="flex-1 text-xs text-muted-foreground py-12 text-center"
    >
      <Icon
        name="lucide:triangle-alert"
        class="size-4 inline mr-1 text-red-500"
      />
      Failed to load growth
    </p>

    <p
      v-else-if="series.length === 0"
      class="flex-1 text-xs text-muted-foreground py-12 text-center"
    >
      No activity yet
    </p>

    <div v-else class="flex-1 flex flex-col px-5 pt-6 pb-4 min-h-[210px]">
      <!-- Plot area: bars over faint gridlines -->
      <div
        class="relative flex-1 flex items-end justify-between gap-3"
        @mouseleave="hoveredKey = null"
      >
        <div
          class="pointer-events-none absolute inset-0 flex flex-col justify-between"
        >
          <span
            v-for="n in 5"
            :key="n"
            class="border-t border-dashed border-border/25"
          />
        </div>

        <div
          v-for="p in series"
          :key="p.month"
          class="relative flex-1 flex items-end justify-center gap-2 h-full"
        >
          <div
            v-for="d in seriesDefs"
            :key="d.key"
            class="flex flex-col items-center justify-end h-full cursor-pointer"
            @mouseenter="hoveredKey = d.key"
          >
            <span
              v-if="p[d.key] > 0"
              class="text-[10px] font-semibold leading-none mb-1 tabular-nums transition-opacity"
              :class="[d.text, dimClass(d.key)]"
            >
              {{ p[d.key] }}
            </span>
            <div
              class="w-4 rounded-t-md transition-all duration-150"
              :class="[d.bar, dimClass(d.key)]"
              :style="{ height: barHeight(p[d.key]) }"
            />
          </div>
        </div>
      </div>

      <!-- Month axis -->
      <div class="flex justify-between gap-3 mt-2">
        <span
          v-for="p in series"
          :key="p.month"
          class="flex-1 text-center text-[11px] text-muted-foreground"
        >
          {{ p.month }}
        </span>
      </div>
    </div>
  </div>
</template>
