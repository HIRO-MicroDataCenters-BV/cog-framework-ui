<template>
  <div v-if="content" class="w-full h-full flex flex-col overflow-hidden">
    <SimpleTabs v-model="activeTab" :tabs="tabs" class="flex-shrink-0" />

    <div class="flex-1 overflow-y-auto px-4 py-4">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-4">
        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Model Details -->
          <Card class="transition-all duration-200 hover:shadow-md">
            <CardHeader class="py-3 px-4">
              <CardTitle class="flex items-center gap-2 text-sm">
                <div class="p-1 rounded bg-blue-100 dark:bg-blue-900/50">
                  <Icon name="lucide:info" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                Model Details
              </CardTitle>
            </CardHeader>
            <CardContent class="px-4 pb-4 pt-0">
              <div class="space-y-0.5">
                <div class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                  <span class="text-muted-foreground text-xs">Model ID</span>
                  <CopyPaste :has-copy="true" icon-left>
                    <code class="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {{ content.id }}
                    </code>
                  </CopyPaste>
                </div>
                <div class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                  <span class="text-muted-foreground text-xs">Type</span>
                  <Badge :variant="content.type" class="text-xs">
                    <Icon name="lucide:bot" class="mr-0.5 w-3 h-3" />
                    {{ content.type }}
                  </Badge>
                </div>
                <div class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                  <span class="text-muted-foreground text-xs">Version</span>
                  <Badge variant="outline" class="text-xs">
                    v{{ content.version }}
                  </Badge>
                </div>
                <div class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                  <span class="text-muted-foreground text-xs flex items-center gap-1">
                    <Icon name="lucide:calendar-plus" class="w-3 h-3" />
                    Created
                  </span>
                  <div class="text-right">
                    <span class="text-xs">{{ dayjs(content.register_date).format('MMM DD, YYYY') }}</span>
                    <span class="text-xs text-muted-foreground ml-1">by {{ content.register_user_id }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                  <span class="text-muted-foreground text-xs flex items-center gap-1">
                    <Icon name="lucide:calendar-check" class="w-3 h-3" />
                    Modified
                  </span>
                  <div class="text-right">
                    <span class="text-xs">{{ dayjs(content.last_modified_time).format('MMM DD, YYYY') }}</span>
                    <span class="text-xs text-muted-foreground ml-1">by {{ content.last_modified_user_id }}</span>
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
                  <Icon name="lucide:settings" class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
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
                  <span class="text-muted-foreground text-xs">{{ formatParamKey(param.key) }}</span>
                  <span class="text-xs font-medium text-right max-w-[60%] bg-muted px-1.5 py-0.5 rounded">
                    {{ param.value }}
                  </span>
                </div>
              </div>
              <div v-else class="text-muted-foreground text-xs text-center py-4">
                <Icon name="lucide:inbox" class="w-6 h-6 mx-auto mb-1 opacity-50" />
                No parameters available
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Performance Metrics -->
        <Card v-if="content.run?.metrics?.length" class="transition-all duration-200 hover:shadow-md">
          <CardHeader class="py-3 px-4">
            <CardTitle class="flex items-center gap-2 text-sm">
              <div class="p-1 rounded bg-green-100 dark:bg-green-900/50">
                <Icon name="lucide:bar-chart-3" class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4 pb-4 pt-0">
            <!-- Summary Metrics -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div
                v-for="metric in summaryMetrics"
                :key="metric.key"
                :class="[metric.bgClass, 'rounded-lg p-2.5 flex items-center justify-between border transition-all duration-200 hover:scale-[1.01]', metric.borderClass]"
              >
                <div :class="['flex items-center gap-1 text-xs', metric.textClass]">
                  <Icon :name="metric.icon" class="w-3 h-3" />
                  {{ metric.label }}
                </div>
                <div :class="['text-sm font-bold', metric.valueClass]">
                  {{ formatMetricDisplay(metric.value) }}
                </div>
              </div>
            </div>

            <!-- All Metrics -->
            <div class="space-y-0.5">
              <div
                v-for="metric in content.run.metrics"
                :key="metric.key"
                class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
              >
                <span class="text-muted-foreground text-xs">{{ formatMetricKey(metric.key) }}</span>
                <span :class="['text-xs font-medium', getMetricColor(metric.value)]">
                  {{ formatMetricDisplay(metric.value) }}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Tags -->
        <Card v-if="content.run?.tags?.length" class="transition-all duration-200 hover:shadow-md">
          <CardHeader class="py-3 px-4">
            <CardTitle class="flex items-center gap-2 text-sm">
              <div class="p-1 rounded bg-amber-100 dark:bg-amber-900/50">
                <Icon name="lucide:tags" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4 pb-4 pt-0">
            <div class="flex flex-wrap gap-1.5">
              <Badge
                v-for="tag in content.run.tags"
                :key="tag"
                variant="secondary"
                class="text-xs px-2 py-0.5 transition-all hover:scale-105"
              >
                <Icon name="lucide:hash" class="w-2.5 h-2.5 mr-0.5" />
                {{ tag }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Artifacts Tab -->
      <div v-if="activeTab === 'artifacts'">
        <div class="text-muted-foreground">
          No artifacts available.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CopyPaste from '~/components/app/CopyPaste.vue';
import SimpleTabs from '~/components/app/SimpleTabs.vue';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';

const { t } = useI18n();
const dayjs = useDayjs();
const route = useRoute();
const { getModelById, getModelAssociationsById } = useApi();
const { setPage, page } = useApp();
const id = computed(() => route.params.id[0] as string);
const content = ref<any>();
const additional = ref<any>();

const activeTab = ref('overview');
const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'artifacts', label: 'Artifacts' },
];

// Helper functions
const getMetricValue = (key: string): string => {
  const metric = content.value?.run?.metrics?.find((m: any) => m.key === key);
  return metric?.value || '0';
};

const getParamValue = (key: string): string => {
  const param = content.value?.run?.params?.find((p: any) => p.key === key);
  return param?.value || '0';
};

const formatPercent = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return `${(num * 100).toFixed(1)}%`;
};

const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return num.toLocaleString();
};

const formatMetricValue = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  if (num <= 1 && num >= 0) return formatPercent(num);
  return formatNumber(num);
};

const formatParamKey = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatMetricKey = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatMetricDisplay = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  if (num <= 1 && num >= 0) return `${(num * 100).toFixed(1)}%`;
  return num.toLocaleString();
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
  const metrics = content.value?.run?.metrics || [];
  const summaryKeys = [
    {
      key: 'test_accuracy',
      label: 'Accuracy',
      icon: 'lucide:target',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      borderClass: 'border-green-200 dark:border-green-800',
      textClass: 'text-green-700 dark:text-green-400',
      valueClass: 'text-green-800 dark:text-green-300'
    },
    {
      key: 'test_f1_macro',
      label: 'F1 Macro',
      icon: 'lucide:gauge',
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      borderClass: 'border-blue-200 dark:border-blue-800',
      textClass: 'text-blue-700 dark:text-blue-400',
      valueClass: 'text-blue-800 dark:text-blue-300'
    },
    {
      key: 'test_f1_weighted',
      label: 'F1 Weighted',
      icon: 'lucide:activity',
      bgClass: 'bg-purple-50 dark:bg-purple-900/20',
      borderClass: 'border-purple-200 dark:border-purple-800',
      textClass: 'text-purple-700 dark:text-purple-400',
      valueClass: 'text-purple-800 dark:text-purple-300'
    },
    {
      key: 'cv_f1_macro',
      label: 'CV F1 Macro',
      icon: 'lucide:git-branch',
      bgClass: 'bg-orange-50 dark:bg-orange-900/20',
      borderClass: 'border-orange-200 dark:border-orange-800',
      textClass: 'text-orange-700 dark:text-orange-400',
      valueClass: 'text-orange-800 dark:text-orange-300'
    },
  ];

  return summaryKeys
    .map((s) => {
      const metric = metrics.find((m: any) => m.key === s.key);
      return metric ? { ...s, value: metric.value } : null;
    })
    .filter(Boolean);
});

onMounted(async () => {
  try {
    const res = await getModelById(id.value);
    console.log('getModelById response:', res);

    if (res && 'data' in res && res.data) {
      const data = res.data;
      console.log('Model data:', data);
      content.value = data;

      if (content.value) {
        setPage({
          section: 'models',
          title: content.value.name as string,
          subtitle: content.value.description as string,
        });
      }
    } else {
      console.error('Invalid response format or no data:', res);
    }

    // Load additional associations data if needed
    try {
      const resAssociations = await getModelAssociationsById(id.value);
      if (
        resAssociations &&
        'data' in resAssociations &&
        resAssociations.data &&
        Array.isArray(resAssociations.data) &&
        resAssociations.data.length > 0
      ) {
        additional.value = resAssociations.data[0];
        console.log('Associations data:', additional.value);
      }
    } catch (err) {
      console.warn('Failed to load associations:', err);
    }
  } catch (error) {
    console.error('Error loading model:', error);
  }
});
</script>

<style scoped>
.overflow-y-auto {
  scrollbar-width: thin;
  scroll-behavior: smooth;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.5);
}
</style>
