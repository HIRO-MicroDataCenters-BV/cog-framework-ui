<template>
  <div class="h-full flex flex-col">
    <!-- Empty state: no base model -->
    <div v-if="!model" class="flex-1 flex items-center justify-center">
      <div class="text-center max-w-md">
        <div class="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
          <Icon
            name="lucide:git-compare"
            class="w-12 h-12 text-muted-foreground/50"
          />
        </div>
        <h3 class="text-lg font-semibold mb-2">Select Models to Compare</h3>
        <p class="text-sm text-muted-foreground">
          Add models to compare metrics, parameters, and details.
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

    <!-- Main comparison view -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Toolbar -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 mb-2 flex-shrink-0"
      >
        <div class="flex items-center gap-3">
          <h2 class="text-base font-semibold">Model Comparison</h2>
          <Badge variant="secondary" class="text-xs">
            {{ allCompareModels.length }} model{{
              allCompareModels.length !== 1 ? 's' : ''
            }}
          </Badge>
        </div>

        <div class="flex items-center gap-2">
          <!-- Hidden for now -->
          <label
            class="hidden flex items-center gap-2 cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
          >
            <Checkbox v-model:checked="showOnlyDifferences" />
            <span>Differences only</span>
          </label>
          <Button
            v-if="selectedModels.length > 0"
            variant="ghost"
            size="sm"
            class="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
            @click="clearAllModels"
          >
            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
            Clear
          </Button>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="flex-1 overflow-auto border rounded-lg bg-card shadow-sm">
        <table class="w-full min-w-[640px] text-sm border-collapse">
          <thead class="sticky top-0 z-10">
            <tr class="bg-background dark:bg-card border-b">
              <!-- Label column -->
              <th
                class="w-48 min-w-48 py-4 px-4 text-left font-medium text-muted-foreground align-bottom bg-background dark:bg-card"
              >
                <span class="text-xs uppercase tracking-wider">Attribute</span>
              </th>
              <!-- Model columns -->
              <th
                v-for="(m, index) in allCompareModels"
                :key="m.id"
                class="min-w-[200px] max-w-[240px] p-0 align-top text-left"
              >
                <div
                  class="relative flex flex-col items-start p-4 border-l transition-colors h-full"
                  :class="[
                    index === 0
                      ? 'bg-primary/5 dark:bg-primary/10 border-primary/20'
                      : 'bg-muted/30 dark:bg-muted/40 border-border/60',
                  ]"
                >
                  <!-- Base badge -->
                  <Badge
                    v-if="index === 0"
                    variant="default"
                    class="absolute top-2 left-2 text-[9px] px-1.5 py-0"
                  >
                    BASE
                  </Badge>
                  <!-- Remove button -->
                  <Button
                    v-if="index !== 0"
                    variant="ghost"
                    size="sm"
                    class="absolute top-1 right-1 h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    @click="removeModel(m.id)"
                  >
                    <Icon name="lucide:x" class="w-3.5 h-3.5" />
                  </Button>

                  <div :class="index === 0 ? 'mt-5' : 'mt-1'">
                    <p
                      class="font-semibold text-foreground truncate pr-6"
                      :title="m.name"
                    >
                      {{ m.name }}
                    </p>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge :variant="m.type" class="text-[10px]">
                        {{ m.type }}
                      </Badge>
                      <span class="text-[11px] text-muted-foreground"
                        >v{{ m.version }}</span
                      >
                    </div>
                  </div>
                </div>
              </th>
              <!-- Add model slots -->
              <th
                v-for="(_, slotIndex) in addSlots"
                :key="'add-' + slotIndex"
                class="min-w-[200px] max-w-[240px] p-0 align-top bg-background dark:bg-card"
              >
                <div
                  :ref="(el) => setAddSlotRef(slotIndex, el as HTMLElement)"
                  class="relative flex flex-col p-4 border-l border-dashed border-border/60 bg-muted/5 h-full"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <Icon
                      name="lucide:plus-circle"
                      class="w-4 h-4 text-muted-foreground/60"
                    />
                    <span class="text-sm font-medium text-muted-foreground"
                      >Add Model</span
                    >
                  </div>
                  <div class="relative">
                    <Input
                      :model-value="searchQueries[slotIndex]"
                      placeholder="Search models..."
                      class="h-8 text-xs pr-8"
                      @update:model-value="
                        (v: string) => (searchQueries[slotIndex] = v)
                      "
                      @focus="openDropdown(slotIndex)"
                    />
                    <Icon
                      name="lucide:search"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
                    />
                  </div>
                  <!-- Dropdown -->
                  <div
                    v-if="openDropdowns[slotIndex]"
                    class="absolute left-2 right-2 top-full mt-1 z-50 bg-popover border rounded-md shadow-lg max-h-52 overflow-auto"
                  >
                    <div
                      v-if="loadingModels"
                      class="p-3 text-center text-xs text-muted-foreground"
                    >
                      <Spinner class="w-4 h-4 mx-auto mb-1" />
                      Loading...
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
                        class="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
                        @click="selectModel(slotIndex, m.id)"
                      >
                        <p class="text-sm font-medium truncate">{{ m.name }}</p>
                        <div class="flex items-center gap-2 mt-0.5">
                          <Badge :variant="m.type" class="text-[9px]">{{
                            m.type
                          }}</Badge>
                          <span class="text-[10px] text-muted-foreground"
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
            <template
              v-for="(row, rowIndex) in filteredComparisonRows"
              :key="row.id"
            >
              <!-- Section headers -->
              <tr
                v-if="shouldShowSectionHeader(row, rowIndex)"
                class="bg-muted/50 dark:bg-muted/30"
              >
                <td
                  :colspan="allCompareModels.length + addSlots.length + 1"
                  class="py-2 px-4"
                >
                  <div class="flex items-center gap-2">
                    <Icon
                      :name="getSectionIcon(row.sectionLabel!)"
                      class="w-3.5 h-3.5 text-muted-foreground"
                    />
                    <span
                      class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >{{ row.sectionLabel }}</span
                    >
                  </div>
                </td>
              </tr>
              <!-- Data rows -->
              <tr
                class="border-b border-border/30 hover:bg-muted/10 transition-colors"
              >
                <td
                  class="py-2.5 px-4 text-muted-foreground font-medium text-sm"
                >
                  {{ row.label }}
                </td>
                <td
                  v-for="(m, mIndex) in allCompareModels"
                  :key="m.id"
                  class="py-2.5 px-4 border-l"
                  :class="[
                    mIndex === 0
                      ? 'border-primary/20 bg-primary/[0.02]'
                      : 'border-border/30',
                  ]"
                >
                  <!-- Metric value with percentage diff -->
                  <div
                    v-if="row.id.startsWith('metric-')"
                    class="flex items-center gap-2"
                  >
                    <span class="font-medium tabular-nums">
                      {{ row.getValue(m) }}
                    </span>
                    <!-- Percentage diff from base -->
                    <span
                      v-if="mIndex !== 0 && getDiffFromBase(row, m) !== null"
                      class="text-[10px] font-medium"
                      :class="getDiffColorClass(getDiffFromBase(row, m)!)"
                    >
                      {{ formatDiff(getDiffFromBase(row, m)!) }}
                    </span>
                  </div>
                  <!-- Regular value -->
                  <span v-else class="text-foreground">{{
                    row.getValue(m)
                  }}</span>
                </td>
                <!-- Empty slots -->
                <td
                  v-for="(_, slotIndex) in addSlots"
                  :key="'empty-' + slotIndex"
                  class="py-2.5 px-4 border-l border-dashed border-border/30 bg-muted/5"
                >
                  <span class="text-muted-foreground/30">—</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Empty differences state -->
      <div
        v-if="filteredComparisonRows.length === 0 && comparisonRows.length > 0"
        class="text-center py-8 text-muted-foreground text-sm"
      >
        <Icon
          name="lucide:check-circle"
          class="w-8 h-8 mx-auto mb-2 text-green-500"
        />
        <p>All values are identical across selected models.</p>
        <button
          class="text-primary hover:underline mt-1"
          @click="showOnlyDifferences = false"
        >
          Show all attributes
        </button>
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

// Refs for click outside
const addSlot0 = ref<HTMLElement | null>(null);
const addSlot1 = ref<HTMLElement | null>(null);
const setAddSlotRef = (index: number, el: HTMLElement | null) => {
  if (index === 0) addSlot0.value = el;
  else if (index === 1) addSlot1.value = el;
};

// State
const loadingModels = ref(false);
const loadingDetails = ref(false);
const availableModels = ref<ModelSummary[]>([]);
const selectedModels = ref<ModelDetail[]>([]);
const showOnlyDifferences = ref(false);

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

onClickOutside(addSlot0, () => {
  openDropdowns.value[0] = false;
});
onClickOutside(addSlot1, () => {
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

const excludedIds = computed(() => {
  const baseId = props.model?.id ? [props.model.id] : [];
  const extraIds = selectedModels.value.map((m) => m.id);
  return [...baseId, ...extraIds];
});

const allMetricKeys = computed(() => {
  const keys = new Set<string>();
  allCompareModels.value.forEach((m) => {
    m.run?.metrics?.forEach((metric) => keys.add(metric.key));
  });
  return Array.from(keys).sort();
});

const allParamKeys = computed(() => {
  const keys = new Set<string>();
  allCompareModels.value.forEach((m) => {
    m.run?.params?.forEach((param) => keys.add(param.key));
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

const getSectionIcon = (section: string): string => {
  const icons: Record<string, string> = {
    'Model info': 'lucide:info',
    Parameters: 'lucide:sliders-horizontal',
    Metrics: 'lucide:bar-chart-3',
  };
  return icons[section] || 'lucide:folder';
};

const shouldShowSectionHeader = (
  row: ComparisonRow,
  index: number,
): boolean => {
  if (!row.sectionLabel) return false;
  if (index === 0) return true;
  return (
    filteredComparisonRows.value[index - 1]?.sectionLabel !== row.sectionLabel
  );
};

const isRowDifferent = (row: ComparisonRow): boolean => {
  const values = allCompareModels.value.map((m) => String(row.getValue(m)));
  return new Set(values).size > 1;
};

const getDiffFromBase = (
  row: ComparisonRow,
  model: ModelDetail,
): number | null => {
  if (!row.id.startsWith('metric-') || !props.model) return null;
  const key = row.id.replace('metric-', '');
  const baseValue = getMetricValue(props.model as ModelDetail, key);
  const compareValue = getMetricValue(model, key);
  if (baseValue === null || compareValue === null || baseValue === 0)
    return null;
  return ((compareValue - baseValue) / baseValue) * 100;
};

const getDiffColorClass = (diff: number): string => {
  if (diff > 0) return 'text-green-600 dark:text-green-400';
  if (diff < 0) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
};

const formatDiff = (diff: number): string => {
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
};

const comparisonRows = computed((): ComparisonRow[] => {
  const rows: ComparisonRow[] = [];
  const models = allCompareModels.value;
  if (models.length === 0) return rows;

  rows.push(
    {
      id: 'description',
      label: 'Description',
      sectionLabel: 'Model info',
      getValue: (m) => m.description || 'N/A',
    },
    {
      id: 'registered',
      label: 'Registered',
      getValue: (m) => formatDate(m.register_date),
    },
    {
      id: 'last_modified',
      label: 'Last Modified',
      getValue: (m) => formatDate(m.last_modified_time),
    },
    {
      id: 'user',
      label: 'Registered By',
      getValue: (m) => m.register_user_id || 'N/A',
    },
  );

  allParamKeys.value.forEach((key, idx) => {
    rows.push({
      id: `param-${key}`,
      label: formatParamKey(key),
      sectionLabel: idx === 0 ? 'Parameters' : undefined,
      getValue: (m) => getParamValue(m, key) ?? 'N/A',
    });
  });

  allMetricKeys.value.forEach((key, idx) => {
    rows.push({
      id: `metric-${key}`,
      label: formatMetricKey(key),
      sectionLabel: idx === 0 ? 'Metrics' : undefined,
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

  // First, find all rows that have differences
  const rowsWithDifferences = comparisonRows.value.filter((row) =>
    isRowDifferent(row),
  );

  // Get the section labels that have at least one difference
  const sectionsWithDifferences = new Set<string>();
  let currentSection = '';
  comparisonRows.value.forEach((row) => {
    if (row.sectionLabel) {
      currentSection = row.sectionLabel;
    }
    if (isRowDifferent(row) && currentSection) {
      sectionsWithDifferences.add(currentSection);
    }
  });

  // Filter rows: show rows with differences + section headers for sections that have differences
  let currentSectionLabel = '';
  return comparisonRows.value.filter((row) => {
    if (row.sectionLabel) {
      currentSectionLabel = row.sectionLabel;
    }
    // Show row if it has differences
    if (isRowDifferent(row)) return true;
    // Show section header row if that section has any differences
    if (row.sectionLabel && sectionsWithDifferences.has(row.sectionLabel)) {
      return true;
    }
    return false;
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
      m.type.toLowerCase().includes(query)
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
      const existing = selectedModels.value.findIndex((m) => m.id === modelId);
      if (existing === -1 && selectedModels.value.length < MAX_EXTRA_MODELS) {
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

const clearAllModels = () => {
  selectedModels.value = [];
};

onMounted(() => {
  fetchModels();
});
</script>
