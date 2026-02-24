<template>
  <div v-if="content" class="w-full h-full flex flex-col overflow-hidden">
    <SimpleTabs v-model="activeTab" :tabs="tabs" class="flex-shrink-0" />

    <div class="flex-1 overflow-y-auto px-4 py-6">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Model Details -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Icon name="lucide:info" class="w-5 h-5 text-muted-foreground" />
                Model Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div class="flex items-start justify-between">
                  <span class="text-muted-foreground text-sm">Model ID</span>
                  <CopyPaste :has-copy="true" icon-left>
                    <code class="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {{ content.id }}
                    </code>
                  </CopyPaste>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-muted-foreground text-sm">Type</span>
                  <Badge class="text-sm">
                    <Icon name="lucide:bot" class="mr-1" />
                    {{ content.type }}
                  </Badge>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-muted-foreground text-sm">Version</span>
                  <Badge variant="outline" class="text-sm">
                    v{{ content.version }}
                  </Badge>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-muted-foreground text-sm">Created</span>
                  <div class="text-right">
                    <div class="text-sm">
                      {{ dayjs(content.register_date).format('MMM DD, YYYY') }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      by {{ content.register_user_id }}
                    </div>
                  </div>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-muted-foreground text-sm">Last Modified</span>
                  <div class="text-right">
                    <div class="text-sm">
                      {{ dayjs(content.last_modified_time).format('MMM DD, YYYY') }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      by {{ content.last_modified_user_id }}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Training Parameters -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Icon name="lucide:settings" class="w-5 h-5 text-muted-foreground" />
                Training Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="content.run?.params?.length" class="space-y-3">
                <div
                  v-for="param in content.run.params"
                  :key="param.key"
                  class="flex items-start justify-between"
                >
                  <span class="text-muted-foreground text-sm">{{ formatParamKey(param.key) }}</span>
                  <span class="text-sm font-medium text-right max-w-[60%]">
                    {{ param.value }}
                  </span>
                </div>
              </div>
              <div v-else class="text-muted-foreground text-sm">
                No parameters available
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Performance Metrics -->
        <Card v-if="content.run?.metrics?.length">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Icon name="lucide:bar-chart-3" class="w-5 h-5 text-muted-foreground" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <!-- Summary Metrics -->
            <div class="mb-6">
              <h4 class="text-sm font-medium mb-3">Summary</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="metric in summaryMetrics" :key="metric.key" class="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon :name="metric.icon" class="w-3.5 h-3.5" />
                    {{ metric.label }}
                  </div>
                  <div class="text-lg font-semibold">
                    {{ formatMetricValue(metric.value) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Class-wise Metrics -->
            <div v-if="classMetrics.length">
              <h4 class="text-sm font-medium mb-3">Per-Class Performance</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left py-2 pr-4 font-medium text-muted-foreground">Class</th>
                      <th class="text-right py-2 px-4 font-medium text-muted-foreground">Precision</th>
                      <th class="text-right py-2 px-4 font-medium text-muted-foreground">Recall</th>
                      <th class="text-right py-2 px-4 font-medium text-muted-foreground">F1-Score</th>
                      <th class="text-right py-2 pl-4 font-medium text-muted-foreground">Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="cls in classMetrics"
                      :key="cls.name"
                      class="border-b border-border/50"
                    >
                      <td class="py-3 pr-4 font-medium">{{ cls.name }}</td>
                      <td class="py-3 px-4 text-right text-muted-foreground">{{ formatPercent(cls.precision) }}</td>
                      <td class="py-3 px-4 text-right text-muted-foreground">{{ formatPercent(cls.recall) }}</td>
                      <td class="py-3 px-4 text-right text-muted-foreground">{{ formatPercent(cls.f1Score) }}</td>
                      <td class="py-3 pl-4 text-right text-muted-foreground">{{ formatNumber(cls.support) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Tags -->
        <Card v-if="content.run?.tags?.length">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Icon name="lucide:tags" class="w-5 h-5 text-muted-foreground" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex flex-wrap gap-2">
              <Badge v-for="tag in content.run.tags" :key="tag" variant="secondary">
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

// Computed for summary metrics
const summaryMetrics = computed(() => {
  const metrics = content.value?.run?.metrics || [];
  const summaryKeys = [
    { key: 'test_accuracy', label: 'Accuracy', icon: 'lucide:target' },
    { key: 'test_f1_macro', label: 'F1 Macro', icon: 'lucide:gauge' },
    { key: 'test_f1_weighted', label: 'F1 Weighted', icon: 'lucide:activity' },
    { key: 'cv_f1_macro', label: 'CV F1 Macro', icon: 'lucide:git-branch' },
  ];

  return summaryKeys
    .map((s) => {
      const metric = metrics.find((m: any) => m.key === s.key);
      return metric ? { ...s, value: metric.value } : null;
    })
    .filter(Boolean);
});

// Computed for class-wise metrics
const classMetrics = computed(() => {
  const metrics = content.value?.run?.metrics || [];
  const classNames = new Set<string>();

  // Extract class names from metric keys like "test_CPU HOG_f1-score"
  metrics.forEach((m: any) => {
    const match = m.key.match(/^test_(.+)_(f1-score|precision|recall|support)$/);
    if (match && !['macro avg', 'weighted avg'].includes(match[1])) {
      classNames.add(match[1]);
    }
  });

  return Array.from(classNames).map((name) => {
    const getVal = (suffix: string) => {
      const metric = metrics.find((m: any) => m.key === `test_${name}_${suffix}`);
      return metric?.value || '0';
    };

    return {
      name,
      precision: getVal('precision'),
      recall: getVal('recall'),
      f1Score: getVal('f1-score'),
      support: getVal('support'),
    };
  });
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
}
</style>
