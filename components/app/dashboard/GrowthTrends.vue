<script setup lang="ts">
import type { GrowthPoint } from '~/composables/useDashboard';

const props = defineProps<{
  series: GrowthPoint[];
  loading: boolean;
  error: boolean;
}>();

const seriesDefs = [
  { key: 'models' as const, label: 'Models', color: 'bg-blue-500' },
  { key: 'datasets' as const, label: 'Datasets', color: 'bg-purple-500' },
];

const maxVal = computed(() =>
  Math.max(1, ...props.series.flatMap((p) => [p.models, p.datasets])),
);

function barHeight(v: number): string {
  return `${Math.max(4, Math.round((v / maxVal.value) * 100))}%`;
}

// ── Hover tooltip ────────────────────────────────────────────────────────────
const hovered = ref<{
  month: string;
  key: string;
  label: string;
  value: number;
  color: string;
} | null>(null);
const tip = ref({ x: 0, y: 0 });
const chartRef = ref<HTMLElement | null>(null);

function trackCursor(e: MouseEvent) {
  const el = chartRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  tip.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
</script>

<template>
  <div class="rounded-xl border border-border/60 bg-card flex flex-col">
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-border/50"
    >
      <div class="flex items-center gap-2">
        <Icon name="lucide:trending-up" class="size-4 text-muted-foreground" />
        <span class="text-sm font-medium">Registrations · last 6 months</span>
      </div>
      <div class="flex items-center gap-3">
        <span
          v-for="d in seriesDefs"
          :key="d.key"
          class="flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span class="size-2 rounded-full" :class="d.color" />
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

    <div
      v-else
      ref="chartRef"
      class="relative flex-1 flex items-stretch justify-between gap-3 px-5 py-5 min-h-[200px]"
      @mousemove="trackCursor"
      @mouseleave="hovered = null"
    >
      <div
        v-for="p in series"
        :key="p.month"
        class="flex-1 flex flex-col items-center gap-2"
      >
        <div
          class="flex-1 flex items-end justify-center gap-1 w-full min-h-[120px]"
        >
          <div
            v-for="d in seriesDefs"
            :key="d.key"
            class="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150"
            :class="[
              d.color,
              hovered && !(hovered.month === p.month && hovered.key === d.key)
                ? 'opacity-40'
                : 'opacity-100',
            ]"
            :style="{ height: barHeight(p[d.key]) }"
            @mouseenter="
              hovered = {
                month: p.month,
                key: d.key,
                label: d.label,
                value: p[d.key],
                color: d.color,
              }
            "
          />
        </div>
        <span class="text-[11px] text-muted-foreground">{{ p.month }}</span>
      </div>

      <!-- Floating tooltip -->
      <div
        v-if="hovered"
        class="pointer-events-none absolute z-20 rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground shadow-md whitespace-nowrap"
        :style="{
          left: `${tip.x}px`,
          top: `${tip.y}px`,
          transform: 'translate(-50%, -135%)',
        }"
      >
        <div class="text-[10px] text-muted-foreground">{{ hovered.month }}</div>
        <div class="flex items-center gap-1.5 text-xs font-medium">
          <span class="size-2 rounded-full" :class="hovered.color" />
          {{ hovered.label }}
          <span class="tabular-nums font-semibold ml-0.5">{{
            hovered.value
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
