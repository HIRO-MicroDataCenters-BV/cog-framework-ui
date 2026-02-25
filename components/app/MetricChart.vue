<script setup lang="ts">
import { computed } from 'vue';
import { VisDonut, VisSingleContainer } from '@unovis/vue';
import { ChartContainer, type ChartConfig } from '~/components/ui/chart';

const props = defineProps<{
  label: string;
  value: number;
  color?: string;
}>();

const percentage = computed(() => Math.round(props.value * 100));

const chartConfig = computed<ChartConfig>(() => ({
  value: {
    label: props.label,
    color: props.color || 'hsl(var(--primary))',
  },
  remaining: {
    label: 'Remaining',
    color: 'hsl(var(--muted))',
  },
}));

const data = computed(() => [
  { key: 'value', value: props.value },
  { key: 'remaining', value: 1 - props.value },
]);

const value = (d: { value: number }) => d.value;
const color = (d: { key: string }) =>
  chartConfig.value[d.key]?.color || 'hsl(var(--muted))';
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <div class="relative w-16 h-16">
      <ChartContainer :config="chartConfig" class="w-full h-full">
        <VisSingleContainer :data="data" class="w-full h-full">
          <VisDonut
            :value="value"
            :color="color"
            :arc-width="8"
            :pad-angle="0.02"
          />
        </VisSingleContainer>
      </ChartContainer>
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-xs font-bold">{{ percentage }}%</span>
      </div>
    </div>
    <span
      class="text-xs text-muted-foreground text-center max-w-16 leading-tight"
      >{{ label }}</span
    >
  </div>
</template>
