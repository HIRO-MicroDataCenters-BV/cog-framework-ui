<template>
  <Card class="transition-all duration-200 hover:shadow-md">
    <CardHeader class="py-3 px-4">
      <CardTitle class="flex items-center gap-2 text-sm">
        <div class="p-1 rounded bg-blue-100 dark:bg-blue-900/50">
          <Icon
            name="lucide:bar-chart-horizontal"
            class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
          />
        </div>
        Metrics Chart
      </CardTitle>
      <p class="text-xs text-muted-foreground mt-0.5">{{ subtitle }}</p>
    </CardHeader>

    <CardContent class="px-4 pb-4 pt-0">
      <div v-if="chartMetrics.length" class="space-y-2.5">
        <div
          v-for="metric in chartMetrics"
          :key="metric.key"
          class="flex items-center gap-3"
        >
          <!-- Label -->
          <span
            class="text-xs text-muted-foreground flex-shrink-0 text-right truncate"
            style="width: 160px"
            :title="metric.label"
            >{{ metric.label }}</span
          >

          <!-- Bar track -->
          <div class="flex-1 flex items-center gap-2">
            <div
              class="flex-1 h-7 rounded overflow-hidden bg-muted/20 relative"
            >
              <div
                class="h-full rounded bg-blue-400/80 dark:bg-blue-400/70 transition-all duration-500"
                :style="{ width: metric.barPct + '%' }"
              />
            </div>
            <!-- Value -->
            <span
              class="text-xs text-muted-foreground flex-shrink-0 w-10 text-right tabular-nums"
            >
              {{ metric.display }}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="text-muted-foreground text-xs text-center py-4">
        <Icon name="lucide:inbox" class="w-6 h-6 mx-auto mb-1 opacity-50" />
        No metrics available
      </div>

      <!-- Footer -->
      <div
        v-if="runName"
        class="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/50"
      >
        <Icon name="lucide:activity" class="w-3 h-3 text-muted-foreground/60" />
        <span class="text-xs text-muted-foreground">{{ runName }}</span>
      </div>
    </CardContent>
  </Card>
</template>

<script lang="ts" setup>
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';

const props = defineProps<{
  metrics: Array<{ key: string; value: string | number }>;
  runName?: string;
  subtitle?: string;
}>();

const formatKey = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

const chartMetrics = computed(() => {
  const filtered = props.metrics
    .map((m) => {
      const n = parseFloat(String(m.value));
      return { key: m.key, raw: n };
    })
    .filter((m) => !isNaN(m.raw));

  if (!filtered.length) return [];

  const max = Math.max(...filtered.map((m) => m.raw));
  if (max <= 0) return [];

  return filtered.map((m) => ({
    key: m.key,
    label: formatKey(m.key),
    barPct: (m.raw / max) * 100,
    display:
      m.raw >= 0 && m.raw <= 1
        ? m.raw.toFixed(2)
        : Number.isInteger(m.raw)
          ? m.raw.toString()
          : m.raw.toFixed(1),
  }));
});
</script>
