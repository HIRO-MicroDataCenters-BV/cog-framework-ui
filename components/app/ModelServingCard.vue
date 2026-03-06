<template>
  <Card class="overflow-hidden transition-shadow hover:shadow-md">
    <!-- Header: name, status, link -->
    <div class="flex items-start justify-between gap-3 p-4 pb-3 border-b border-border/60">
      <div class="min-w-0 flex-1">
        <h3 class="font-semibold text-foreground truncate" :title="serving.isvc_name">
          {{ serving.isvc_name }}
        </h3>
        <div class="flex items-center gap-2 mt-1 flex-wrap">
          <Badge
            :class="statusVariant"
            class="text-[10px] font-medium"
          >
            {{ serving.status }}
          </Badge>
          <a
            v-if="serving.served_model_url"
            :href="serving.served_model_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary truncate max-w-[200px]"
          >
            <Icon name="lucide:external-link" class="w-3 h-3 shrink-0" />
            <span class="truncate">Open endpoint</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Meta: model, age, revision -->
    <div class="px-4 py-3 space-y-2 text-sm">
      <div v-if="serving.model_name || serving.model_version" class="flex items-center gap-2">
        <span class="text-muted-foreground shrink-0">Model</span>
        <span class="font-medium truncate">
          {{ serving.model_name ?? '—' }}
          <span v-if="serving.model_version" class="text-muted-foreground font-normal"
            >v{{ serving.model_version }}</span
          >
        </span>
      </div>
      <div class="flex items-center justify-between gap-2 text-muted-foreground">
        <span>Age</span>
        <span class="tabular-nums">{{ serving.age }}</span>
      </div>
      <div class="flex items-center justify-between gap-2 text-muted-foreground">
        <span>Revision</span>
        <span class="truncate text-right max-w-[180px]" :title="serving.latest_ready_revision">
          {{ serving.latest_ready_revision }}
        </span>
      </div>
    </div>

    <!-- Traffic split (canary deployment) -->
    <div class="px-4 pb-4 pt-2 border-t border-border/50 bg-muted/20">
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Traffic split
        </span>
        <span class="text-xs text-muted-foreground">
          Stable {{ 100 - localCanaryPercent }}% · Canary {{ localCanaryPercent }}%
        </span>
      </div>
      <!-- Visual bar -->
      <div class="h-2 w-full rounded-full overflow-hidden bg-muted flex mb-3">
        <div
          class="h-full bg-primary/80 transition-all duration-300"
          :style="{ width: `${100 - localCanaryPercent}%` }"
        />
        <div
          class="h-full bg-amber-500/80 dark:bg-amber-500/70 transition-all duration-300"
          :style="{ width: `${localCanaryPercent}%` }"
        />
      </div>
      <div class="flex items-center gap-3">
        <div class="flex-1 flex items-center gap-2">
          <span class="text-xs text-muted-foreground shrink-0">Canary</span>
          <input
            v-model.number="localCanaryPercent"
            type="range"
            min="0"
            max="100"
            class="flex-1 h-2 rounded-full appearance-none bg-muted accent-amber-500"
            @input="onSliderInput"
          />
          <span class="text-xs font-medium tabular-nums w-8">{{ localCanaryPercent }}%</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          class="shrink-0"
          :disabled="isSaving || !hasChanges"
          @click="saveTraffic"
        >
          <Icon
            v-if="isSaving"
            name="lucide:loader-2"
            class="w-3.5 h-3.5 animate-spin"
          />
          <template v-else>Update</template>
        </Button>
      </div>
    </div>
  </Card>
</template>

<script lang="ts" setup>
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import type { ModelServing } from '~/types/model.types';

const props = defineProps<{
  serving: ModelServing;
}>();

const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const { patchModelServing } = useApi();
const toaster = useToaster();

const isSaving = ref(false);
const localCanaryPercent = ref(
  props.serving.canary_traffic_percent ?? props.serving.traffic_percentage ?? 0,
);

const statusVariant = computed(() => {
  const s = props.serving.status?.toLowerCase();
  if (s === 'ready') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (s === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  if (s === 'failed') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-muted text-muted-foreground';
});

const hasChanges = computed(
  () =>
    localCanaryPercent.value !== (props.serving.canary_traffic_percent ?? props.serving.traffic_percentage ?? 0),
);

watch(
  () => props.serving.canary_traffic_percent ?? props.serving.traffic_percentage,
  (v) => {
    localCanaryPercent.value = v ?? 0;
  },
);

function onSliderInput() {
  localCanaryPercent.value = Math.min(100, Math.max(0, Number(localCanaryPercent.value)));
}

async function saveTraffic() {
  if (!hasChanges.value) return;
  isSaving.value = true;
  try {
    await patchModelServing({
      isvc_name: props.serving.isvc_name,
      canary_traffic_percent: localCanaryPercent.value,
    });
    emit('updated');
  } catch (e) {
    console.error(e);
    toaster.show('error', 'Failed to update traffic');
  } finally {
    isSaving.value = false;
  }
}
</script>
