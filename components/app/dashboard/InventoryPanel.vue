<script setup lang="ts">
// Shared inventory panel: a donut composition chart (total in the centre) beside
// a legend of icon · label · count · share%. Hovering a slice or a legend row
// highlights the pair and shows a floating tooltip. Colours come from each stat's
// Tailwind text-colour class, inherited into the SVG via `currentColor`.
interface InventoryStat {
  label: string;
  count: number;
  icon: string;
  colorClass: string;
  members?: { label: string; count: number }[];
}

const props = defineProps<{
  title: string;
  headerIcon: string;
  total: number;
  unit: string;
  stats: InventoryStat[];
  loading: boolean;
  error: boolean;
  emptyText: string;
}>();

const SIZE = 136;
const CENTER = SIZE / 2;
const STROKE = 16;
const HOVER_STROKE = 20;
const RADIUS = 54;
const CIRC = 2 * Math.PI * RADIUS;

// Sequential arc segments; each starts where the previous ended.
const segments = computed(() => {
  let acc = 0;
  return props.stats.map((s) => {
    const frac = props.total > 0 ? s.count / props.total : 0;
    const dash = frac * CIRC;
    const seg = {
      key: s.label,
      colorClass: s.colorClass,
      dashArray: `${dash} ${CIRC - dash}`,
      dashOffset: -acc,
    };
    acc += dash;
    return seg;
  });
});

function share(count: number): number {
  return props.total > 0 ? Math.round((count / props.total) * 100) : 0;
}

// ── Hover state ──────────────────────────────────────────────────────────────
const hoveredKey = ref<string | null>(null);
const tip = ref({ x: 0, y: 0 });
const donutRef = ref<HTMLElement | null>(null);

const hoveredStat = computed(
  () => props.stats.find((s) => s.label === hoveredKey.value) ?? null,
);

function trackCursor(e: MouseEvent) {
  const el = donutRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  tip.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
</script>

<template>
  <div class="rounded-xl border border-border/60 bg-card flex flex-col">
    <div class="flex items-center gap-2 px-4 py-3 border-b border-border/50">
      <Icon :name="headerIcon" class="size-4 text-muted-foreground" />
      <span class="text-sm font-medium">{{ title }}</span>
    </div>

    <!-- loading -->
    <div v-if="loading" class="flex-1 flex items-center gap-5 px-4 py-4">
      <span
        class="size-[136px] shrink-0 rounded-full border-[16px] border-muted animate-pulse"
      />
      <div class="flex-1 space-y-2.5">
        <div v-for="i in 4" :key="i" class="flex items-center gap-2">
          <span class="size-2.5 rounded-full bg-muted animate-pulse" />
          <span class="h-3 flex-1 rounded bg-muted animate-pulse" />
          <span class="h-3 w-6 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>

    <!-- error -->
    <p
      v-else-if="error"
      class="flex-1 text-xs text-muted-foreground py-10 text-center"
    >
      <Icon
        name="lucide:triangle-alert"
        class="size-4 inline mr-1 text-red-500"
      />
      Failed to load
    </p>

    <!-- empty -->
    <p
      v-else-if="stats.length === 0"
      class="flex-1 text-xs text-muted-foreground py-10 text-center"
    >
      {{ emptyText }}
    </p>

    <!-- data -->
    <div v-else class="flex-1 flex items-center gap-4 px-4 py-4">
      <!-- Donut -->
      <div
        ref="donutRef"
        class="relative shrink-0"
        :style="{ width: `${SIZE}px`, height: `${SIZE}px` }"
        @mousemove="trackCursor"
        @mouseleave="hoveredKey = null"
      >
        <svg
          :width="SIZE"
          :height="SIZE"
          :viewBox="`0 0 ${SIZE} ${SIZE}`"
          class="-rotate-90"
        >
          <circle
            :cx="CENTER"
            :cy="CENTER"
            :r="RADIUS"
            fill="none"
            :stroke-width="STROKE"
            stroke="currentColor"
            class="text-muted-foreground/15"
          />
          <circle
            v-for="seg in segments"
            :key="seg.key"
            :cx="CENTER"
            :cy="CENTER"
            :r="RADIUS"
            fill="none"
            stroke="currentColor"
            stroke-linecap="butt"
            class="cursor-pointer transition-all duration-150"
            :class="[
              seg.colorClass,
              hoveredKey && hoveredKey !== seg.key
                ? 'opacity-25'
                : 'opacity-100',
            ]"
            :stroke-width="hoveredKey === seg.key ? HOVER_STROKE : STROKE"
            :stroke-dasharray="seg.dashArray"
            :stroke-dashoffset="seg.dashOffset"
            @mouseenter="hoveredKey = seg.key"
          />
        </svg>

        <!-- Centre label -->
        <div
          class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span
            class="text-2xl font-bold tracking-tight leading-none tabular-nums"
            >{{ total }}</span
          >
          <span class="text-[10px] text-muted-foreground mt-0.5">{{
            unit
          }}</span>
        </div>

        <!-- Floating tooltip -->
        <div
          v-if="hoveredStat"
          class="pointer-events-none absolute z-20 rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground shadow-md whitespace-nowrap"
          :style="{
            left: `${tip.x}px`,
            top: `${tip.y}px`,
            transform: 'translate(-50%, -135%)',
          }"
        >
          <div class="flex items-center gap-1.5 text-xs font-medium">
            <span
              class="size-2 rounded-full bg-current"
              :class="hoveredStat.colorClass"
            />
            {{ hoveredStat.label }}
          </div>
          <div class="text-[11px] text-muted-foreground tabular-nums">
            {{ hoveredStat.count }} {{ unit }} · {{ share(hoveredStat.count) }}%
          </div>
          <div
            v-if="hoveredStat.members?.length"
            class="mt-1 pt-1 border-t border-border/60 space-y-0.5"
          >
            <div
              v-for="m in hoveredStat.members"
              :key="m.label"
              class="flex items-center justify-between gap-4 text-[11px] text-muted-foreground"
            >
              <span>{{ m.label }}</span>
              <span class="tabular-nums">{{ m.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div
        class="flex-1 min-w-0 max-h-[176px] overflow-y-auto pr-1 -mr-1 space-y-0.5"
      >
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="flex items-center gap-2 rounded-md px-1.5 py-1 cursor-default transition-colors"
          :class="
            hoveredKey === stat.label
              ? 'bg-muted/60'
              : hoveredKey
                ? 'opacity-50'
                : ''
          "
          @mouseenter="hoveredKey = stat.label"
          @mouseleave="hoveredKey = null"
        >
          <span
            class="size-2.5 rounded-full bg-current shrink-0"
            :class="stat.colorClass"
          />
          <Icon
            :name="stat.icon"
            class="size-3.5 shrink-0"
            :class="stat.colorClass"
          />
          <span class="text-sm truncate flex-1">{{ stat.label }}</span>
          <span class="text-sm font-semibold tabular-nums">{{
            stat.count
          }}</span>
          <span
            class="text-[10px] text-muted-foreground tabular-nums w-9 text-right"
            >{{ share(stat.count) }}%</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
