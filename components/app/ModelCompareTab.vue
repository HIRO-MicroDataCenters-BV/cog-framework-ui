<template>
  <div class="h-full flex flex-col">
    <!-- Empty state: no base model (e.g. page not loaded) -->
    <div
      v-if="!model"
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
          Add at least one model using the comparison grid to compare metrics,
          parameters, and details.
        </p>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-else-if="loadingDetails"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center">
        <Spinner class="w-8 h-8 mx-auto mb-3" />
        <p class="text-sm text-muted-foreground">Loading model details...</p>
      </div>
    </div>

    <!-- Comparison grid (similar to product compare layout) -->
    <div v-else class="flex-1 overflow-auto pb-4">
      <!-- Header: title + item count + show only differences -->
      <div class="flex flex-wrap items-center gap-3 mb-3">
        <h2 class="text-lg font-semibold truncate max-w-md">
          Compare {{ model?.name ?? 'Model' }} vs others
        </h2>
        <span class="text-sm text-muted-foreground whitespace-nowrap">
          {{ allCompareModels.length }} item{{ allCompareModels.length !== 1 ? 's' : '' }}
        </span>
        <label
          class="flex items-center gap-2 cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground"
        >
          <Checkbox v-model:checked="showOnlyDifferences" />
          <span>Show only differences</span>
        </label>
      </div>

      <div class="overflow-x-auto border rounded-lg bg-card shadow-sm pt-4">
        <table class="w-full min-w-[640px] text-sm border-collapse">
          <thead>
            <tr class="border-b bg-background/70 dark:bg-muted/40">
              <!-- Label column -->
              <th
                class="w-48 min-w-48 pt-6 pb-4 px-4 text-left font-medium text-muted-foreground align-top"
              >
                &nbsp;
              </th>
              <!-- Model columns: card (icon, name, badge, remove) -->
              <th
                v-for="m in allCompareModels"
                :key="m.id"
                class="min-w-[220px] max-w-[260px] p-0 align-top"
              >
                <div
                  class="relative flex h-full flex-col pt-6 pb-5 px-4 border border-border/60 border-b-0 border-r last:border-r-0 transition-colors"
                  :class="[
                    m.id === model?.id
                      ? 'bg-primary/5 ring-1 ring-primary/40'
                      : 'bg-muted/40 dark:bg-muted/60',
                  ]"
                >
                  <Button
                    v-if="m.id !== model?.id"
                    variant="ghost"
                    size="sm"
                    class="absolute top-2 right-2 h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive"
                    @click="removeModel(m.id)"
                  >
                    <Icon name="lucide:x" class="w-4 h-4" />
                  </Button>
                  <p
                    class="font-medium text-foreground truncate pr-8 mb-1"
                    :title="m.name"
                  >
                    {{ m.name }}
                  </p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge :variant="m.type" class="text-xs">
                      {{ m.type }}
                    </Badge>
                    <span class="text-xs text-muted-foreground">v{{ m.version }}</span>
                  </div>
                </div>
              </th>
              <!-- Add a model columns -->
              <th
                v-for="(_, slotIndex) in addSlots"
                :key="'add-' + slotIndex"
                class="min-w-[220px] max-w-[260px] p-0 align-top"
              >
                <div
                  :ref="slotIndex === 0 ? addSlot0Ref : addSlot1Ref"
                  class="relative flex h-full flex-col pt-6 pb-5 px-4 border border-border/60 border-b-0 border-r last:border-r-0 border-dashed bg-muted/10"
                >
                  <p class="text-sm font-medium text-muted-foreground mb-3">
                    Add a model
                  </p>
                  <div class="relative">
                    <Input
                      :model-value="searchQueries[slotIndex]"
                      placeholder="Choose a model"
                      class="h-9 text-sm pr-8"
                      @update:model-value="(v: string) => (searchQueries[slotIndex] = v)"
                      @focus="openDropdown(slotIndex)"
                    />
                    <Icon
                      name="lucide:chevron-down"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                    />
                  </div>
                  <!-- Dropdown list -->
                  <div
                    v-if="openDropdowns[slotIndex]"
                    class="absolute left-0 right-0 top-full mt-3 z-50 bg-popover border rounded-md shadow-lg max-h-52 overflow-auto min-w-[200px]"
                  >
                    <div
                      v-if="loadingModels"
                      class="p-3 text-center text-xs text-muted-foreground"
                    >
                      Loading models...
                    </div>
                    <div
                      v-else-if="getFilteredModels(slotIndex).length === 0"
                      class="p-3 text-center text-xs text-muted-foreground"
                    >
                      No models found
                    </div>
                    <template v-else>
                      <button
                        v-for="m in getFilteredModels(slotIndex)"
                        :key="m.id"
                        type="button"
                        class="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0 text-sm"
                        @click="selectModel(slotIndex, m.id)"
                      >
                        <p class="font-medium truncate">{{ m.name }}</p>
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
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, rowIndex) in filteredComparisonRows" :key="row.id">
              <!-- Section headers (Model info, Parameters, Metrics) -->
              <tr
                v-if="row.sectionLabel && (rowIndex === 0 || filteredComparisonRows[rowIndex - 1]?.sectionLabel !== row.sectionLabel)"
                class="bg-muted/40"
              >
                <td
                  colspan="100"
                  class="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {{ row.sectionLabel }}
                </td>
              </tr>
              <tr
                class="border-b border-border/50 hover:bg-muted/20 transition-colors"
                :class="{ 'bg-muted/10': row.sectionLabel }"
              >
                <td class="py-2.5 px-4 text-muted-foreground font-medium">
                  {{ row.label }}
                </td>
                <td
                  v-for="m in allCompareModels"
                  :key="m.id"
                  class="py-2.5 px-4 border-r border-border/50 last:border-r-0"
                >
                  <span class="text-foreground">{{ row.getValue(m) }}</span>
                </td>
                <td
                  v-for="(_, slotIndex) in addSlots"
                  :key="'add-' + slotIndex"
                  class="py-2.5 px-4 border-r border-border/50 last:border-r-0 bg-muted/10"
                >
                  &nbsp;
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Empty state when "Show only differences" filters everything -->
      <div
        v-if="filteredComparisonRows.length === 0 && comparisonRows.length > 0"
        class="text-center py-8 text-muted-foreground text-sm"
      >
        No differences between the selected models. Uncheck "Show only
        differences" to see all specs.
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core';
import { Checkbox } from '~/components/ui/checkbox';
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

// Refs for click outside (add model dropdowns)
const addSlot0Ref = ref<HTMLElement | null>(null);
const addSlot1Ref = ref<HTMLElement | null>(null);
const addSlotRefs = [addSlot0Ref, addSlot1Ref];

// State
const loadingModels = ref(false);
const loadingDetails = ref(false);
const availableModels = ref<ModelSummary[]>([]);
const selectedModels = ref<ModelDetail[]>([]);
const showOnlyDifferences = ref(false);

// We allow comparing base model + up to 2 more
const MAX_EXTRA_MODELS = 2;
const searchQueries = ref<string[]>(Array(MAX_EXTRA_MODELS).fill(''));
const openDropdowns = ref<boolean[]>(Array(MAX_EXTRA_MODELS).fill(false));

const addSlots = computed(() => {
  const remaining = Math.max(
    0,
    1 + MAX_EXTRA_MODELS - allCompareModels.value.length,
  );
  return Array.from({ length: remaining }, (_, i) => i);
});

onClickOutside([addSlot0Ref, addSlot1Ref], () => {
  openDropdowns.value[0] = false;
  openDropdowns.value[1] = false;
});

const allCompareModels = computed(() => {
  const models: ModelDetail[] = [];
  if (props.model) {
    models.push(props.model as ModelDetail);
  }
  models.push(...selectedModels.value);
  return models;
});

// Computed
const excludedIds = computed(() => {
  const baseId = props.model?.id ? [props.model.id] : [];
  const extraIds = selectedModels.value.map((m) => m.id);
  return [...baseId, ...extraIds];
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

const allParamKeys = computed(() => {
  const keys = new Set<string>();
  allCompareModels.value.forEach((m) => {
    m.run?.params?.forEach((param) => {
      keys.add(param.key);
    });
  });
  return Array.from(keys).sort();
});

type ComparisonRow = {
  id: string;
  label: string;
  sectionLabel?: string;
  getValue: (m: ModelDetail) => string | number;
};

const formatDate = (date: string | undefined): string => {
  if (!date) return 'N/A';
  return dayjs(date).format('MMM DD, YYYY');
};

const formatMetricKey = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatParamKey = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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

const comparisonRows = computed((): ComparisonRow[] => {
  const rows: ComparisonRow[] = [];
  const models = allCompareModels.value;

  if (models.length === 0) return rows;

  rows.push(
    { id: 'description', label: 'Description', sectionLabel: 'Model info', getValue: (m) => m.description || 'N/A' },
    { id: 'registered', label: 'Registered', getValue: (m) => formatDate(m.register_date) },
    { id: 'last_modified', label: 'Last modified', getValue: (m) => formatDate(m.last_modified_time) },
    { id: 'user', label: 'Registered by', getValue: (m) => m.register_user_id || 'N/A' },
  );

  const hasParams = allParamKeys.value.length > 0;
  allParamKeys.value.forEach((key, idx) => {
    rows.push({
      id: `param-${key}`,
      label: formatParamKey(key),
      sectionLabel: idx === 0 && hasParams ? 'Parameters' : undefined,
      getValue: (m) => getParamValue(m, key) ?? 'N/A',
    });
  });

  const hasMetrics = allMetricKeys.value.length > 0;
  allMetricKeys.value.forEach((key, idx) => {
    rows.push({
      id: `metric-${key}`,
      label: formatMetricKey(key),
      sectionLabel: idx === 0 && hasMetrics ? 'Metrics' : undefined,
      getValue: (m) => {
        const v = getMetricValue(m, key);
        return v !== null ? Number(v).toFixed(4) : 'N/A';
      },
    });
  });

  return rows;
});

const filteredComparisonRows = computed(() => {
  if (!showOnlyDifferences.value) return comparisonRows.value;
  const models = allCompareModels.value;
  return comparisonRows.value.filter((row) => {
    if (row.sectionLabel && row.label === row.sectionLabel) return true;
    const values = models.map((m) => String(row.getValue(m)));
    const unique = new Set(values);
    return unique.size > 1;
  });
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
  if (index < 0 || index >= MAX_EXTRA_MODELS) return;
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

const selectModel = async (index: number, modelId: string) => {
  if (index < 0 || index >= MAX_EXTRA_MODELS) return;
  openDropdowns.value[index] = false;
  searchQueries.value[index] = '';

  loadingDetails.value = true;
  try {
    const response = await getModelById(modelId);
    if (response.data) {
      const existingIndex = selectedModels.value.findIndex((m) => m.id === modelId);
      if (existingIndex === -1 && selectedModels.value.length < MAX_EXTRA_MODELS) {
        selectedModels.value.push(response.data);
      }
    }
  } catch (error) {
    console.error('Failed to fetch model details:', error);
  } finally {
    loadingDetails.value = false;
  }
};

const removeModel = (modelId: string) => {
  selectedModels.value = selectedModels.value.filter((m) => m.id !== modelId);
};

onMounted(() => {
  fetchModels();
});
</script>
