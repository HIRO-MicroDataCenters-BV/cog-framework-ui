<script setup lang="ts">
import { computed } from 'vue';
import { VisXYContainer, VisGroupedBar, VisAxis } from '@unovis/vue';
import { ChartContainer, type ChartConfig } from '~/components/ui/chart';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';

const props = defineProps<{
  metrics: Array<{ key: string; value: number | string }>;
}>();

// Format metric key for display
const formatMetricKey = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

// Chart data - filter for percentage metrics (0-1 range)
const chartData = computed(() => {
  return props.metrics
    .filter(m => {
      const num = parseFloat(String(m.value));
      return !isNaN(num) && num >= 0 && num <= 1;
    })
    .map((m, i) => ({
      x: i,
      name: formatMetricKey(m.key),
      value: parseFloat(String(m.value)),
    }))
    .slice(0, 10);
});

// Chart config
const chartConfig: ChartConfig = {
  value: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
};

// X accessor - numeric index
const xAccessor = (d: { x: number }) => d.x;

// Y accessor
const yAccessor = [(d: { value: number }) => d.value];

// Color based on value
const colorAccessor = (d: { value: number }) => {
  if (d.value >= 0.9) return 'hsl(142, 76%, 36%)';
  if (d.value >= 0.7) return 'hsl(217, 91%, 60%)';
  if (d.value >= 0.5) return 'hsl(25, 95%, 53%)';
  return 'hsl(0, 84%, 60%)';
};

// X-axis label formatter
const xTickFormat = (i: number) => {
  const item = chartData.value[Math.round(i)];
  if (!item) return '';
  const name = item.name;
  return name.length > 12 ? name.slice(0, 12) + '..' : name;
};
</script>

<template>
  <Card v-if="chartData.length" class="transition-all duration-200 hover:shadow-md">
    <CardHeader class="py-3 px-4">
      <CardTitle class="flex items-center gap-2 text-sm">
        <div class="p-1 rounded bg-indigo-100 dark:bg-indigo-900/50">
          <Icon name="lucide:bar-chart-3" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        </div>
        Metrics Overview
      </CardTitle>
    </CardHeader>
    <CardContent class="px-4 pb-4 pt-0">
      <ChartContainer :config="chartConfig" class="h-[300px] w-full">
        <VisXYContainer
          :data="chartData"
          :margin="{ left: 50, right: 20, top: 20, bottom: 80 }"
        >
          <VisGroupedBar
            :x="xAccessor"
            :y="yAccessor"
            :color="colorAccessor"
            :roundedCorners="4"
            :barPadding="0.2"
          />
          <VisAxis
            type="x"
            :tickFormat="xTickFormat"
            :numTicks="chartData.length"
            :tickTextAngle="-45"
            :tickTextWidth="100"
          />
          <VisAxis
            type="y"
            :tickFormat="(v: number) => `${Math.round(v * 100)}%`"
            :numTicks="5"
            :gridLine="true"
            :domainLine="false"
          />
        </VisXYContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>

<style scoped>
:deep(.vis-axis-label) {
  fill: hsl(var(--foreground));
}
:deep(.vis-axis-tick text) {
  fill: hsl(var(--muted-foreground));
  font-size: 10px;
}
:deep(.vis-axis-grid-line) {
  stroke: hsl(var(--border));
  stroke-opacity: 0.5;
}
</style>
