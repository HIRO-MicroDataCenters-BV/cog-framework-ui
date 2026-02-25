<template>
  <div class="bg-card border rounded-lg overflow-hidden flex flex-col">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-border/50"
    >
      <div class="flex items-center gap-1.5 min-w-0">
        <Icon
          name="lucide:grip-vertical"
          class="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0"
        />
        <span class="text-xs font-medium truncate" :title="name">{{
          name
        }}</span>
      </div>
      <div class="flex items-center gap-0.5 flex-shrink-0 ml-2">
        <button class="p-0.5 rounded hover:bg-muted/50 transition-colors">
          <Icon
            name="lucide:maximize-2"
            class="w-3 h-3 text-muted-foreground/60"
          />
        </button>
        <button class="p-0.5 rounded hover:bg-muted/50 transition-colors">
          <Icon
            name="lucide:more-vertical"
            class="w-3.5 h-3.5 text-muted-foreground/60"
          />
        </button>
      </div>
    </div>

    <!-- Chart body -->
    <div class="px-3 pt-2 pb-1 flex-1">
      <!-- Bar + grid container -->
      <div class="relative" style="height: 52px">
        <!-- Vertical grid lines -->
        <div
          v-for="(tick, i) in ticks"
          :key="`grid-${i}`"
          class="absolute top-0 pointer-events-none border-l border-border/25"
          :style="{ left: tick.pct + '%', bottom: '16px' }"
        />

        <!-- Bar -->
        <div
          class="absolute top-1.5 h-8 bg-blue-500 dark:bg-blue-500/85 rounded-sm transition-all duration-500 flex items-center"
          :style="{
            width: Math.min(barPct, 100) + '%',
            minWidth: numericValue > 0 ? '2px' : '0',
          }"
        >
          <!-- Value inside bar (if wide enough) -->
          <span
            v-if="barPct > 14"
            class="absolute right-1.5 text-[11px] text-white font-medium leading-none"
            >{{ formattedValue }}</span
          >
        </div>

        <!-- Value outside bar (if bar too narrow) -->
        <span
          v-if="barPct <= 14 && numericValue > 0"
          class="absolute top-1.5 h-8 flex items-center text-[11px] font-medium text-foreground leading-none"
          :style="{ left: Math.min(barPct, 100) + '%', paddingLeft: '4px' }"
          >{{ formattedValue }}</span
        >

        <!-- Axis line -->
        <div
          class="absolute left-0 right-0 border-t border-border/30"
          style="bottom: 16px"
        />

        <!-- Tick marks + labels row -->
        <div class="absolute left-0 right-0" style="bottom: 0; height: 16px">
          <span
            v-for="(tick, i) in ticks"
            :key="`lbl-${i}`"
            class="absolute text-[9px] text-muted-foreground leading-none top-1"
            :style="getTickLabelStyle(tick.pct, i)"
            >{{ tick.label }}</span
          >
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div v-if="runName" class="flex items-center gap-1.5 px-3 pb-2 pt-0.5">
      <div class="w-4 h-0.5 bg-blue-500 dark:bg-blue-400 flex-shrink-0" />
      <span class="text-[10px] text-muted-foreground truncate">{{
        runName
      }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  name: string;
  value: number | string;
  runName?: string;
}>();

const numericValue = computed(() => {
  const n =
    typeof props.value === 'string' ? parseFloat(props.value) : props.value;
  return isNaN(n) ? 0 : n;
});

const isNormalized = computed(
  () => numericValue.value >= 0 && numericValue.value <= 1,
);

const chartMax = computed(() => {
  const v = numericValue.value;
  if (v >= 0 && v <= 1) return 1;
  if (v <= 0) return 1;
  const rough = v * 1.05;
  const exp = Math.floor(Math.log10(rough));
  const mag = Math.pow(10, exp);
  return Math.ceil(rough / mag) * mag;
});

const ticks = computed(() => {
  const max = chartMax.value;
  if (isNormalized.value) {
    return [0, 0.2, 0.4, 0.6, 0.8, 1.0].map((v) => ({
      value: v,
      label: v === 0 ? '0' : v.toString(),
      pct: v * 100,
    }));
  }

  // Compute nice step for ~4 intervals
  const rawStep = max / 4;
  const stepExp = Math.floor(Math.log10(rawStep));
  const stepMag = Math.pow(10, stepExp);
  const ratio = rawStep / stepMag;
  let step: number;
  if (ratio <= 1) step = stepMag;
  else if (ratio <= 2) step = 2 * stepMag;
  else if (ratio <= 5) step = 5 * stepMag;
  else step = 10 * stepMag;

  const result = [];
  for (let v = 0; v <= max * 1.001; v += step) {
    const rounded = parseFloat(v.toPrecision(10));
    result.push({
      value: rounded,
      label: Number.isInteger(rounded)
        ? rounded.toString()
        : rounded.toFixed(1),
      pct: (rounded / max) * 100,
    });
    if (result.length > 8) break;
  }
  return result;
});

const barPct = computed(() => (numericValue.value / chartMax.value) * 100);

const formattedValue = computed(() => {
  const n = numericValue.value;
  if (isNormalized.value) return n.toFixed(2);
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
});

function getTickLabelStyle(pct: number, i: number): Record<string, string> {
  if (i === 0) return { left: '0%', transform: 'translateX(0)' };
  if (i === ticks.value.length - 1)
    return { left: '100%', transform: 'translateX(-100%)' };
  return { left: pct + '%', transform: 'translateX(-50%)' };
}
</script>
