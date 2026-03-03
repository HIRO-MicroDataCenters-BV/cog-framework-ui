<template>
  <div class="h-full flex flex-col">
    <!-- Model Selector Section -->
    <Card class="mb-4 transition-all duration-200">
      <CardHeader class="py-3 px-4">
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center gap-2 text-sm">
            <div class="p-1 rounded bg-purple-100 dark:bg-purple-900/50">
              <Icon
                name="lucide:git-compare"
                class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400"
              />
            </div>
            Select Models to Compare
          </CardTitle>
          <Button
            v-if="selectedModels.length > 0"
            variant="ghost"
            size="sm"
            class="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
            @click="clearAllModels"
          >
            <Icon name="lucide:x" class="w-3 h-3" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <!-- Current Model (Model A - Locked) -->
          <div
            class="relative p-3 rounded-lg border-2 border-primary/30 bg-primary/5"
          >
            <div
              class="absolute -top-2 left-3 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded"
            >
              Base Model (Current)
            </div>
            <div class="mt-2">
              <p class="text-sm font-medium truncate">
                {{ model?.name || 'No model selected' }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <Badge :variant="model?.type || 'secondary'" class="text-xs">
                  {{ model?.type || 'N/A' }}
                </Badge>
                <span class="text-xs text-muted-foreground"
                  >v{{ model?.version ?? 0 }}</span
                >
              </div>
            </div>
          </div>

          <!-- Model B Selector -->
          <div
            ref="selectorB"
            class="relative p-3 rounded-lg border border-dashed hover:border-solid hover:border-muted-foreground/30 transition-colors"
          >
            <div
              class="absolute -top-2 left-3 px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded"
            >
              Model B
            </div>
            <div class="mt-2">
              <!-- Selected Model Display -->
              <div
                v-if="getSelectedModel(0)"
                class="flex items-center justify-between"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ getSelectedModel(0)?.name }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <Badge :variant="getSelectedModel(0)?.type" class="text-xs">
                      {{ getSelectedModel(0)?.type }}
                    </Badge>
                    <span class="text-xs text-muted-foreground"
                      >v{{ getSelectedModel(0)?.version }}</span
                    >
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0 ml-2 flex-shrink-0"
                  @click="clearModelSelection(0)"
                >
                  <Icon name="lucide:x" class="w-3.5 h-3.5" />
                </Button>
              </div>

              <!-- Model Selector -->
              <div v-else>
                <div class="relative">
                  <Input
                    v-model="searchQueries[0]"
                    placeholder="Select model to compare..."
                    class="h-8 text-xs pr-8"
                    @focus="openDropdown(0)"
                  />
                  <Icon
                    name="lucide:search"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                  />
                </div>

                <!-- Dropdown -->
                <div
                  v-if="openDropdowns[0]"
                  class="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto"
                >
                  <div
                    v-if="loadingModels"
                    class="p-3 text-center text-xs text-muted-foreground"
                  >
                    Loading models...
                  </div>
                  <div
                    v-else-if="getFilteredModels(0).length === 0"
                    class="p-3 text-center text-xs text-muted-foreground"
                  >
                    No models found
                  </div>
                  <template v-else>
                    <button
                      v-for="m in getFilteredModels(0)"
                      :key="m.id"
                      class="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
                      @click="selectModel(0, m.id)"
                    >
                      <p class="text-sm font-medium truncate">{{ m.name }}</p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <Badge :variant="m.type" class="text-[10px]">{{
                          m.type
                        }}</Badge>
                        <span class="text-xs text-muted-foreground"
                          >v{{ m.version }}</span
                        >
                      </div>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Model C Selector (Optional) -->
          <div
            ref="selectorC"
            class="relative p-3 rounded-lg border border-dashed hover:border-solid hover:border-muted-foreground/30 transition-colors"
          >
            <div
              class="absolute -top-2 left-3 px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded"
            >
              Model C (Optional)
            </div>
            <div class="mt-2">
              <!-- Selected Model Display -->
              <div
                v-if="getSelectedModel(1)"
                class="flex items-center justify-between"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ getSelectedModel(1)?.name }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <Badge :variant="getSelectedModel(1)?.type" class="text-xs">
                      {{ getSelectedModel(1)?.type }}
                    </Badge>
                    <span class="text-xs text-muted-foreground"
                      >v{{ getSelectedModel(1)?.version }}</span
                    >
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0 ml-2 flex-shrink-0"
                  @click="clearModelSelection(1)"
                >
                  <Icon name="lucide:x" class="w-3.5 h-3.5" />
                </Button>
              </div>

              <!-- Model Selector -->
              <div v-else>
                <div class="relative">
                  <Input
                    v-model="searchQueries[1]"
                    placeholder="Add another model..."
                    class="h-8 text-xs pr-8"
                    @focus="openDropdown(1)"
                  />
                  <Icon
                    name="lucide:search"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                  />
                </div>

                <!-- Dropdown -->
                <div
                  v-if="openDropdowns[1]"
                  class="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto"
                >
                  <div
                    v-if="loadingModels"
                    class="p-3 text-center text-xs text-muted-foreground"
                  >
                    Loading models...
                  </div>
                  <div
                    v-else-if="getFilteredModels(1).length === 0"
                    class="p-3 text-center text-xs text-muted-foreground"
                  >
                    No models found
                  </div>
                  <template v-else>
                    <button
                      v-for="m in getFilteredModels(1)"
                      :key="m.id"
                      class="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
                      @click="selectModel(1, m.id)"
                    >
                      <p class="text-sm font-medium truncate">{{ m.name }}</p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <Badge :variant="m.type" class="text-[10px]">{{
                          m.type
                        }}</Badge>
                        <span class="text-xs text-muted-foreground"
                          >v{{ m.version }}</span
                        >
                      </div>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Comparison Content -->
    <div
      v-if="selectedModels.length === 0"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center max-w-md">
        <div class="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
          <Icon
            name="lucide:git-compare"
            class="w-12 h-12 text-muted-foreground/50"
          />
        </div>
        <h3 class="text-lg font-semibold mb-2">Select Models to Compare</h3>
        <p class="text-sm text-muted-foreground">
          Choose at least one model from the dropdown above to start comparing
          metrics, parameters, and performance.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="loadingDetails"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center">
        <Spinner class="w-8 h-8 mx-auto mb-3" />
        <p class="text-sm text-muted-foreground">Loading model details...</p>
      </div>
    </div>

    <!-- Comparison Results -->
    <div v-else class="flex-1 overflow-auto space-y-4">
      <!-- Model Information -->
      <Card class="transition-all duration-200 hover:shadow-md">
        <CardHeader class="py-3 px-4">
          <CardTitle class="flex items-center gap-2 text-sm">
            <div class="p-1 rounded bg-green-100 dark:bg-green-900/50">
              <Icon
                name="lucide:info"
                class="w-3.5 h-3.5 text-green-600 dark:text-green-400"
              />
            </div>
            Model Information
          </CardTitle>
        </CardHeader>
        <CardContent class="px-4 pb-4 pt-0">
          <div class="grid gap-3" :class="gridColsClass">
            <div
              v-for="m in allCompareModels"
              :key="m.id"
              class="p-3 rounded-lg border bg-card dark:bg-muted/30 dark:border-primary/40"
              :class="
                m.id === model?.id ? 'border-primary/50' : 'border-border'
              "
            >
              <div class="flex items-center gap-2 mb-3">
                <Badge :variant="m.type" class="text-xs">
                  {{ m.type }}
                </Badge>
                <span class="text-xs text-muted-foreground"
                  >v{{ m.version }}</span
                >
                <Badge
                  v-if="m.id === model?.id"
                  variant="outline"
                  class="text-[10px] border-primary text-primary"
                >
                  Base
                </Badge>
              </div>
              <h4 class="font-medium text-sm mb-2 truncate">{{ m.name }}</h4>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Description</span>
                  <span class="text-right max-w-32 truncate">{{
                    m.description || 'N/A'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Registered</span>
                  <span>{{ formatDate(m.register_date) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Last Modified</span>
                  <span>{{ formatDate(m.last_modified_time) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">User</span>
                  <span class="truncate max-w-24">{{
                    m.register_user_id
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Parameters Comparison -->
      <Card class="transition-all duration-200 hover:shadow-md">
        <CardHeader class="py-3 px-4">
          <CardTitle class="flex items-center gap-2 text-sm">
            <div class="p-1 rounded bg-orange-100 dark:bg-orange-900/50">
              <Icon
                name="lucide:settings"
                class="w-3.5 h-3.5 text-orange-600 dark:text-orange-400"
              />
            </div>
            Parameters Comparison
          </CardTitle>
        </CardHeader>
        <CardContent class="px-4 pb-4 pt-0">
          <div v-if="allParamKeys.length === 0" class="text-center py-4">
            <Icon
              name="lucide:inbox"
              class="w-6 h-6 mx-auto mb-2 text-muted-foreground/50"
            />
            <p class="text-xs text-muted-foreground">
              No parameters available for comparison
            </p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b">
                  <th
                    class="text-left py-2 px-3 font-medium text-muted-foreground w-48"
                  >
                    Parameter
                  </th>
                  <th
                    v-for="m in allCompareModels"
                    :key="m.id"
                    class="text-center py-2 px-3 font-medium min-w-32"
                  >
                    <span class="truncate max-w-28">{{ m.name }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="paramKey in allParamKeys"
                  :key="paramKey"
                  class="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td class="py-2 px-3 text-muted-foreground">
                    {{ formatParamKey(paramKey) }}
                  </td>
                  <td
                    v-for="m in allCompareModels"
                    :key="m.id"
                    class="py-2 px-3 text-center"
                  >
                    <span class="text-xs">{{
                      getParamValue(m, paramKey) ?? 'N/A'
                    }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <!-- Metrics Comparison -->
      <Card class="transition-all duration-200 hover:shadow-md">
        <CardHeader class="py-3 px-4">
          <div class="flex items-center justify-between">
            <CardTitle class="flex items-center gap-2 text-sm">
              <div class="p-1 rounded bg-blue-100 dark:bg-blue-900/50">
                <Icon
                  name="lucide:bar-chart-3"
                  class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
                />
              </div>
              Metrics Comparison
            </CardTitle>
            <div class="flex items-center gap-2">
              <Button
                v-for="view in ['table', 'chart'] as const"
                :key="view"
                variant="ghost"
                size="sm"
                class="h-7 px-2 text-xs"
                :class="
                  metricsView === view
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                "
                @click="metricsView = view"
              >
                <Icon
                  :name="
                    view === 'table'
                      ? 'lucide:table-2'
                      : 'lucide:bar-chart-horizontal'
                  "
                  class="w-3 h-3 mr-1"
                />
                {{ view === 'table' ? 'Table' : 'Chart' }}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent class="px-4 pb-4 pt-0">
          <!-- Table View -->
          <div v-if="metricsView === 'table'" class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b">
                  <th
                    class="text-left py-2 px-3 font-medium text-muted-foreground w-48"
                  >
                    Metric
                  </th>
                  <th
                    v-for="m in allCompareModels"
                    :key="m.id"
                    class="text-center py-2 px-3 font-medium min-w-32"
                  >
                    <div class="flex flex-col items-center gap-1">
                      <Badge :variant="m.type" class="text-[10px]">
                        {{ m.type }}
                      </Badge>
                      <span class="truncate max-w-28">{{ m.name }}</span>
                      <span
                        v-if="m.id === model?.id"
                        class="text-[9px] text-primary font-normal"
                        >(Base)</span
                      >
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="metricKey in allMetricKeys"
                  :key="metricKey"
                  class="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td class="py-2 px-3 text-muted-foreground">
                    {{ formatMetricKey(metricKey) }}
                  </td>
                  <td
                    v-for="m in allCompareModels"
                    :key="m.id"
                    class="py-2 px-3 text-center"
                  >
                    <div>
                      <span class="font-medium tabular-nums">
                        {{
                          getMetricValue(m, metricKey) !== null
                            ? getMetricValue(m, metricKey)?.toFixed(4)
                            : 'N/A'
                        }}
                      </span>
                      <div
                        v-if="
                          getMetricDiff(m, metricKey) !== null &&
                          m.id !== model?.id
                        "
                        :class="[
                          'text-[10px] mt-0.5',
                          (getMetricDiff(m, metricKey) ?? 0) >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400',
                        ]"
                      >
                        {{ (getMetricDiff(m, metricKey) ?? 0) >= 0 ? '+' : ''
                        }}{{ getMetricDiff(m, metricKey)?.toFixed(1) }}%
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Chart View -->
          <div v-else class="space-y-3">
            <div
              v-for="metricKey in normalizedMetricKeys"
              :key="metricKey"
              class="p-3 rounded-lg border bg-card/50"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium">{{
                  formatMetricKey(metricKey)
                }}</span>
                <div class="flex items-center gap-1">
                  <Icon
                    v-if="getBestModelForMetric(metricKey)"
                    name="lucide:trophy"
                    class="w-3 h-3 text-yellow-500"
                  />
                  <span class="text-[10px] text-muted-foreground">
                    Best: {{ getBestModelForMetric(metricKey)?.name ?? 'N/A' }}
                  </span>
                </div>
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="m in allCompareModels"
                  :key="m.id"
                  class="flex items-center gap-2"
                >
                  <span
                    class="text-[10px] text-muted-foreground w-20 truncate text-right"
                    >{{ m.name }}</span
                  >
                  <div
                    class="flex-1 h-5 rounded overflow-hidden bg-muted/30 relative"
                  >
                    <div
                      class="h-full rounded transition-all duration-500"
                      :class="getBarColorClass(m, metricKey)"
                      :style="{ width: getBarWidth(m, metricKey) }"
                    />
                  </div>
                  <span
                    class="text-xs font-medium w-12 text-right tabular-nums"
                  >
                    {{
                      getMetricValue(m, metricKey) !== null
                        ? getMetricValue(m, metricKey)?.toFixed(4)
                        : 'N/A'
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import type { ModelDetail, ModelSummary } from '~/types/model.types';

const props = defineProps<{
  model: ModelDetail | null;
}>();

const dayjs = useDayjs();
const { getModels, getModelById } = useApi();

// Refs for click outside
const selectorB = ref<HTMLElement | null>(null);
const selectorC = ref<HTMLElement | null>(null);

// State
const loadingModels = ref(false);
const loadingDetails = ref(false);
const availableModels = ref<ModelSummary[]>([]);
const selectedModelIds = ref<(string | null)[]>([null, null]);
const selectedModels = ref<ModelDetail[]>([]);
const metricsView = ref<'table' | 'chart'>('table');
const searchQueries = ref<string[]>(['', '']);
const openDropdowns = ref<boolean[]>([false, false]);

// Click outside handlers
onClickOutside(selectorB, () => {
  openDropdowns.value[0] = false;
});
onClickOutside(selectorC, () => {
  openDropdowns.value[1] = false;
});

// Computed
const excludedIds = computed(() => {
  const ids = [props.model?.id, ...selectedModelIds.value].filter(
    Boolean,
  ) as string[];
  return ids;
});

const allCompareModels = computed(() => {
  const models: ModelDetail[] = [];
  if (props.model) {
    models.push(props.model as ModelDetail);
  }
  models.push(...selectedModels.value);
  return models;
});

const allMetricKeys = computed(() => {
  const keys = new Set<string>();
  allCompareModels.value.forEach((m) => {
    m.run?.metrics?.forEach((metric) => {
      keys.add(metric.key);
    });
  });
  return Array.from(keys).sort();
});

const normalizedMetricKeys = computed(() => {
  return allMetricKeys.value.filter((key) => {
    const values = allCompareModels.value
      .map((m) => getMetricValue(m, key))
      .filter((v) => v !== null) as number[];
    return values.every((v) => v >= 0 && v <= 1);
  });
});

const allParamKeys = computed(() => {
  const keys = new Set<string>();
  allCompareModels.value.forEach((m) => {
    m.run?.params?.forEach((param) => {
      keys.add(param.key);
    });
  });
  return Array.from(keys).sort();
});

const gridColsClass = computed(() => {
  const count = allCompareModels.value.length;
  if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
  return 'grid-cols-1 md:grid-cols-3';
});

// Methods
const fetchModels = async () => {
  loadingModels.value = true;
  try {
    const response = await getModels({ limit: 100 });
    availableModels.value = response.data || [];
  } catch (error) {
    console.error('Failed to fetch models:', error);
  } finally {
    loadingModels.value = false;
  }
};

const openDropdown = (index: number) => {
  openDropdowns.value[index] = true;
};

const getFilteredModels = (index: number) => {
  const query = searchQueries.value[index]?.toLowerCase() || '';
  return availableModels.value.filter((m) => {
    if (excludedIds.value.includes(m.id)) return false;
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.type.toLowerCase().includes(query) ||
      m.id.toLowerCase().includes(query)
    );
  });
};

const getSelectedModel = (index: number) => {
  const modelId = selectedModelIds.value[index];
  if (!modelId) return null;
  return availableModels.value.find((m) => m.id === modelId);
};

const selectModel = async (index: number, modelId: string) => {
  selectedModelIds.value[index] = modelId;
  openDropdowns.value[index] = false;
  searchQueries.value[index] = '';

  loadingDetails.value = true;
  try {
    const response = await getModelById(modelId);
    if (response.data) {
      const existingIndex = selectedModels.value.findIndex(
        (m) => m.id === modelId,
      );
      if (existingIndex === -1) {
        selectedModels.value.push(response.data);
      }
    }
  } catch (error) {
    console.error('Failed to fetch model details:', error);
    selectedModelIds.value[index] = null;
  } finally {
    loadingDetails.value = false;
  }
};

const clearModelSelection = (index: number) => {
  const modelId = selectedModelIds.value[index];
  selectedModels.value = selectedModels.value.filter((m) => m.id !== modelId);
  selectedModelIds.value[index] = null;
};

const clearAllModels = () => {
  selectedModelIds.value = [null, null];
  selectedModels.value = [];
};

const getMetricValue = (model: ModelDetail, key: string): number | null => {
  const metric = model.run?.metrics?.find((m) => m.key === key);
  if (!metric) return null;
  const num =
    typeof metric.value === 'string' ? parseFloat(metric.value) : metric.value;
  return isNaN(num) ? null : num;
};

const getParamValue = (model: ModelDetail, key: string): string | null => {
  const param = model.run?.params?.find((p) => p.key === key);
  return param?.value ?? null;
};

const isBestValue = (metricKey: string, modelId: string): boolean => {
  const values = allCompareModels.value.map((m) => ({
    id: m.id,
    value: getMetricValue(m, metricKey),
  }));
  const validValues = values.filter((v) => v.value !== null);
  if (validValues.length === 0) return false;
  const maxValue = Math.max(...validValues.map((v) => v.value!));
  const best = validValues.find((v) => v.value === maxValue);
  return best?.id === modelId;
};

const getBestModelForMetric = (metricKey: string): ModelDetail | null => {
  const values = allCompareModels.value.map((m) => ({
    model: m,
    value: getMetricValue(m, metricKey),
  }));
  const validValues = values.filter((v) => v.value !== null);
  if (validValues.length === 0) return null;
  const maxValue = Math.max(...validValues.map((v) => v.value!));
  return validValues.find((v) => v.value === maxValue)?.model ?? null;
};

const getMetricDiff = (
  model: ModelDetail,
  metricKey: string,
): number | null => {
  if (model.id === props.model?.id || !props.model) return null;
  const baseValue = getMetricValue(props.model as ModelDetail, metricKey);
  const compareValue = getMetricValue(model, metricKey);
  if (baseValue === null || compareValue === null) return null;
  if (baseValue === 0) return null;
  return ((compareValue - baseValue) / baseValue) * 100;
};

const isParamDifferent = (paramKey: string, modelId: string): boolean => {
  if (!props.model || modelId === props.model.id) return false;
  const baseValue = getParamValue(props.model as ModelDetail, paramKey);
  const model = allCompareModels.value.find((m) => m.id === modelId);
  if (!model) return false;
  const compareValue = getParamValue(model, paramKey);
  return baseValue !== compareValue;
};

const getBarWidth = (model: ModelDetail, metricKey: string): string => {
  const value = getMetricValue(model, metricKey);
  if (value === null) return '0%';
  return `${Math.min(100, value * 100)}%`;
};

const getBarColorClass = (model: ModelDetail, metricKey: string): string => {
  const isBest = isBestValue(metricKey, model.id);
  const isBase = model.id === props.model?.id;

  if (isBest) return 'bg-green-500 dark:bg-green-400';
  if (isBase) return 'bg-blue-500 dark:bg-blue-400';
  return 'bg-purple-400 dark:bg-purple-500';
};

const formatMetricKey = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatParamKey = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatDate = (date: string | undefined): string => {
  if (!date) return 'N/A';
  return dayjs(date).format('MMM DD, YYYY');
};

// Lifecycle
onMounted(() => {
  fetchModels();
});
</script>
