<template>
  <div class="space-y-4">
    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Model Details -->
      <Card class="transition-all duration-200 hover:shadow-md">
        <CardHeader class="py-3 px-4">
          <CardTitle class="flex items-center gap-2 text-sm">
            <div class="p-1 rounded bg-blue-100 dark:bg-blue-900/50">
              <Icon
                name="lucide:info"
                class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
              />
            </div>
            Model Details
          </CardTitle>
        </CardHeader>
        <CardContent class="px-4 pb-4 pt-0">
          <div class="space-y-0.5">
            <div
              class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
            >
              <span class="text-muted-foreground text-xs">Model ID</span>
              <CopyPaste :has-copy="true" icon-left>
                <code
                  class="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
                >
                  {{ content.id }}
                </code>
              </CopyPaste>
            </div>
            <div
              class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
            >
              <span class="text-muted-foreground text-xs">Type</span>
              <Badge :variant="content.type" class="text-xs">
                <Icon name="lucide:bot" class="mr-0.5 w-3 h-3" />
                {{ content.type }}
              </Badge>
            </div>
            <div
              class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
            >
              <span class="text-muted-foreground text-xs">Version</span>
              <Badge variant="outline" class="text-xs">
                v{{ content.version }}
              </Badge>
            </div>
            <div
              class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
            >
              <span
                class="text-muted-foreground text-xs flex items-center gap-1"
              >
                <Icon name="lucide:calendar-plus" class="w-3 h-3" />
                Created
              </span>
              <div class="text-right">
                <span class="text-xs">{{
                  dayjs(content.register_date).format('MMM DD, YYYY')
                }}</span>
                <span class="text-xs text-muted-foreground ml-1"
                  >by {{ content.register_user_id }}</span
                >
              </div>
            </div>
            <div
              class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
            >
              <span
                class="text-muted-foreground text-xs flex items-center gap-1"
              >
                <Icon name="lucide:calendar-check" class="w-3 h-3" />
                Modified
              </span>
              <div class="text-right">
                <span class="text-xs">{{
                  dayjs(content.last_modified_time).format('MMM DD, YYYY')
                }}</span>
                <span class="text-xs text-muted-foreground ml-1"
                  >by {{ content.last_modified_user_id }}</span
                >
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Training Parameters -->
      <Card class="transition-all duration-200 hover:shadow-md">
        <CardHeader class="py-3 px-4">
          <CardTitle class="flex items-center gap-2 text-sm">
            <div class="p-1 rounded bg-purple-100 dark:bg-purple-900/50">
              <Icon
                name="lucide:settings"
                class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400"
              />
            </div>
            Training Parameters
          </CardTitle>
        </CardHeader>
        <CardContent class="px-4 pb-4 pt-0">
          <div v-if="content.run?.params?.length" class="space-y-0.5">
            <div
              v-for="param in content.run.params"
              :key="param.key"
              class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
            >
              <span class="text-muted-foreground text-xs">{{
                formatParamKey(param.key)
              }}</span>
              <span
                class="text-xs font-medium text-right max-w-[60%] bg-muted px-1.5 py-0.5 rounded"
              >
                {{ param.value }}
              </span>
            </div>
          </div>
          <div
            v-else
            class="flex flex-col items-center justify-center text-muted-foreground text-xs py-4"
          >
            <Icon
              name="lucide:inbox"
              class="w-6 h-6 mb-1 opacity-50"
            />
            <span>No parameters available</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Metrics Section with Chart / Table toggle -->
    <Tabs v-model="metricsView">
      <Card class="transition-all duration-200 hover:shadow-md">
        <CardHeader class="py-3 px-4">
          <div class="flex items-center justify-between">
            <CardTitle class="flex items-center gap-2 text-sm">
              <div
                :class="
                  metricsView === 'chart'
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'bg-green-100 dark:bg-green-900/50'
                "
                class="p-1 rounded"
              >
                <Icon
                  :name="
                    metricsView === 'chart'
                      ? 'lucide:bar-chart-horizontal'
                      : 'lucide:bar-chart-3'
                  "
                  :class="
                    metricsView === 'chart'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
                  "
                  class="w-3.5 h-3.5"
                />
              </div>
              {{
                metricsView === 'chart'
                  ? 'Metrics Chart'
                  : 'Performance Metrics'
              }}
            </CardTitle>
            <TabsList v-if="content.run?.metrics?.length" class="h-7">
              <TabsTrigger value="table" class="h-6 px-2.5 text-xs gap-1">
                <Icon name="lucide:table-2" class="w-3 h-3" />
                Table
              </TabsTrigger>
              <TabsTrigger value="chart" class="h-6 px-2.5 text-xs gap-1">
                <Icon name="lucide:bar-chart-horizontal" class="w-3 h-3" />
                Chart
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent class="px-4 pb-4 pt-0">
          <!-- Empty state -->
          <div
            v-if="!content.run?.metrics?.length"
            class="flex flex-col items-center justify-center text-muted-foreground text-xs py-4"
          >
            <Icon
              name="lucide:bar-chart-3"
              class="w-6 h-6 mb-1 opacity-50"
            />
            <span>No metrics available</span>
          </div>

          <!-- Metrics content (only when data available) -->
          <template v-if="content.run?.metrics?.length">
          <!-- Chart view -->
          <TabsContent value="chart" class="mt-0">
            <!-- Normalized metrics (0-1 scale) -->
            <div v-if="normalizedMetricsChartData.length" class="mb-6">
              <p class="text-xs text-muted-foreground mb-3">
                <span class="font-medium">Normalized Metrics</span> (scale:
                0-1) - {{ normalizedMetricsChartData.length }} metrics
              </p>
              <TooltipProvider>
                <div class="space-y-2.5">
                  <Tooltip
                    v-for="metric in normalizedMetricsChartData"
                    :key="metric.key"
                  >
                    <TooltipTrigger as-child>
                      <div
                        class="group flex items-center gap-3 p-1.5 -mx-1.5 rounded-md hover:bg-muted/30 transition-colors cursor-default"
                      >
                        <span
                          class="text-xs text-muted-foreground group-hover:text-foreground flex-shrink-0 text-right truncate transition-colors"
                          style="width: 160px"
                          >{{ metric.label }}</span
                        >
                        <div class="flex-1 flex items-center gap-2">
                          <div
                            class="flex-1 h-7 rounded overflow-hidden bg-muted/20 group-hover:bg-muted/40 transition-colors"
                          >
                            <div
                              class="h-full rounded bg-blue-400/80 dark:bg-blue-400/70 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-all duration-300"
                              :style="{ width: metric.barPct + '%' }"
                            />
                          </div>
                          <span
                            class="text-xs text-muted-foreground group-hover:text-foreground group-hover:font-medium flex-shrink-0 w-10 text-right tabular-nums transition-all"
                          >
                            {{ metric.display }}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" class="text-xs">
                      <p class="font-medium">{{ metric.label }}</p>
                      <p class="text-muted-foreground">
                        Value: {{ metric.display }}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            <!-- Other metrics (different scales) -->
            <div v-if="otherMetricsChartData.length">
              <p class="text-xs text-muted-foreground mb-3">
                <span class="font-medium">Other Metrics</span> -
                {{ otherMetricsChartData.length }} metrics
              </p>
              <TooltipProvider>
                <div class="space-y-2.5">
                  <Tooltip
                    v-for="metric in otherMetricsChartData"
                    :key="metric.key"
                  >
                    <TooltipTrigger as-child>
                      <div
                        class="group flex items-center gap-3 p-1.5 -mx-1.5 rounded-md hover:bg-muted/30 transition-colors cursor-default"
                      >
                        <span
                          class="text-xs text-muted-foreground group-hover:text-foreground flex-shrink-0 text-right truncate transition-colors"
                          style="width: 160px"
                          >{{ metric.label }}</span
                        >
                        <div class="flex-1 flex items-center gap-2">
                          <div
                            class="flex-1 h-7 rounded overflow-hidden bg-muted/20 group-hover:bg-muted/40 transition-colors"
                          >
                            <div
                              class="h-full rounded bg-green-400/80 dark:bg-green-400/70 group-hover:bg-green-500 dark:group-hover:bg-green-400 transition-all duration-300"
                              :style="{ width: metric.barPct + '%' }"
                            />
                          </div>
                          <span
                            class="text-xs text-muted-foreground group-hover:text-foreground group-hover:font-medium flex-shrink-0 w-10 text-right tabular-nums transition-all"
                          >
                            {{ metric.display }}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" class="text-xs">
                      <p class="font-medium">{{ metric.label }}</p>
                      <p class="text-muted-foreground">
                        Value: {{ metric.display }}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            <div
              class="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/50"
            >
              <Icon
                name="lucide:activity"
                class="w-3 h-3 text-muted-foreground/60"
              />
              <span class="text-xs text-muted-foreground">{{
                content.name
              }}</span>
            </div>
          </TabsContent>

          <!-- Table view -->
          <TabsContent value="table" class="mt-0">
            <!-- Summary Metrics -->
            <div
              v-if="summaryMetrics.length"
              class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4"
            >
              <div
                v-for="metric in summaryMetrics"
                :key="metric.key"
                :class="[
                  metric.bgClass,
                  'rounded-lg p-2.5 flex items-center justify-between border transition-all duration-200 hover:scale-[1.01]',
                  metric.borderClass,
                ]"
              >
                <div
                  :class="[
                    'flex items-center gap-1 text-xs',
                    metric.textClass,
                  ]"
                >
                  <Icon :name="metric.icon" class="w-3 h-3" />
                  {{ metric.label }}
                </div>
                <div :class="['text-sm font-bold', metric.valueClass]">
                  {{ formatMetricDisplay(metric.value) }}
                </div>
              </div>
            </div>
            <!-- All Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
              <div
                v-for="metric in content.run.metrics"
                :key="metric.key"
                class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
              >
                <span class="text-muted-foreground text-xs">{{
                  formatMetricKey(metric.key)
                }}</span>
                <span
                  :class="[
                    'text-sm font-medium',
                    getMetricColor(metric.value),
                  ]"
                >
                  {{ formatMetricDisplay(metric.value) }}
                </span>
              </div>
            </div>
          </TabsContent>
          </template>
        </CardContent>
      </Card>
    </Tabs>

  </div>
</template>

<script lang="ts" setup>
import CopyPaste from '~/components/app/CopyPaste.vue';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';

const props = defineProps<{
  content: any;
}>();

const dayjs = useDayjs();
const metricsView = ref<'chart' | 'table'>('table');

// Helper functions
const formatParamKey = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatMetricKey = (key: string): string => {
  return key;
};

const formatMetricDisplay = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toFixed(2);
};

// Get color class based on metric value
const getMetricColor = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  if (num <= 1 && num >= 0) {
    if (num >= 0.9) return 'text-green-600 dark:text-green-400';
    if (num >= 0.7) return 'text-blue-600 dark:text-blue-400';
    if (num >= 0.5) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }
  return '';
};

// Summary metrics for quick view
const summaryMetrics = computed(() => {
  const metrics = props.content?.run?.metrics || [];
  const summaryKeys = [
    {
      key: 'test_accuracy',
      label: 'Accuracy',
      icon: 'lucide:target',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      borderClass: 'border-green-200 dark:border-green-800',
      textClass: 'text-green-700 dark:text-green-400',
      valueClass: 'text-green-800 dark:text-green-300',
    },
    {
      key: 'test_f1_macro',
      label: 'F1 Macro',
      icon: 'lucide:gauge',
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      borderClass: 'border-blue-200 dark:border-blue-800',
      textClass: 'text-blue-700 dark:text-blue-400',
      valueClass: 'text-blue-800 dark:text-blue-300',
    },
    {
      key: 'test_f1_weighted',
      label: 'F1 Weighted',
      icon: 'lucide:activity',
      bgClass: 'bg-purple-50 dark:bg-purple-900/20',
      borderClass: 'border-purple-200 dark:border-purple-800',
      textClass: 'text-purple-700 dark:text-purple-400',
      valueClass: 'text-purple-800 dark:text-purple-300',
    },
    {
      key: 'cv_f1_macro',
      label: 'CV F1 Macro',
      icon: 'lucide:git-branch',
      bgClass: 'bg-orange-50 dark:bg-orange-900/20',
      borderClass: 'border-orange-200 dark:border-orange-800',
      textClass: 'text-orange-700 dark:text-orange-400',
      valueClass: 'text-orange-800 dark:text-orange-300',
    },
  ];

  return summaryKeys
    .map((s) => {
      const metric = metrics.find((m: any) => m.key === s.key);
      return metric ? { ...s, value: metric.value } : null;
    })
    .filter(Boolean);
});

// Metrics with 0-1 scale (ratios, percentages)
const normalizedMetricsChartData = computed(() => {
  const metrics = props.content?.run?.metrics || [];
  const parsed = metrics
    .map((m: any) => ({ key: m.key, raw: parseFloat(String(m.value)) }))
    .filter((m: any) => !isNaN(m.raw) && m.raw >= 0 && m.raw <= 1);
  if (parsed.length === 0) return [];
  return parsed.map((m: any) => ({
    key: m.key,
    label: formatMetricKey(m.key),
    barPct: m.raw * 100,
    display: m.raw.toFixed(2),
  }));
});

// Metrics with other scales (counts, larger values)
const otherMetricsChartData = computed(() => {
  const metrics = props.content?.run?.metrics || [];
  const parsed = metrics
    .map((m: any) => ({ key: m.key, raw: parseFloat(String(m.value)) }))
    .filter((m: any) => !isNaN(m.raw) && (m.raw < 0 || m.raw > 1));
  if (parsed.length === 0) return [];
  const max = Math.max(...parsed.map((m: any) => m.raw));
  if (max <= 0) return [];
  return parsed.map((m: any) => ({
    key: m.key,
    label: formatMetricKey(m.key),
    barPct: (m.raw / max) * 100,
    display: Number.isInteger(m.raw) ? String(m.raw) : m.raw.toFixed(2),
  }));
});
</script>
