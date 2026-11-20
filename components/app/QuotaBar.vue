<script setup lang="ts">
/**
 * One resource of a quota: a thin usage bar with `used / cap` beside it.
 *
 * Draws nothing meaningful without a cap (`hard === null`): the parent
 * decides whether to show such rows at all. Colour steps at 80% and 100%.
 */
import type { QuotaResourceUsage } from '~/types/api.types';
import { formatQuotaValue, quotaBarClass, quotaPercent } from '~/utils/quota';

const props = withDefaults(
  defineProps<{
    row: QuotaResourceUsage;
    /** Hide the label; used inside table cells where the column says it. */
    compact?: boolean;
  }>(),
  { compact: false },
);

const { t } = useI18n();

const label = computed(() => t(`label.quota_${props.row.resource}`));
const capped = computed(() => props.row.hard !== null);
const percent = computed(() => quotaPercent(props.row.ratio));
const barClass = computed(() => quotaBarClass(props.row.ratio));
const usedText = computed(() =>
  formatQuotaValue(props.row.resource, props.row.used_value),
);
const hardText = computed(() =>
  formatQuotaValue(props.row.resource, props.row.hard_value),
);
/** Text colour follows the bar: calm, amber from 80%, red at the cap. */
const textClass = computed(() => {
  if (percent.value >= 100) return 'text-red-600 dark:text-red-400 font-medium';
  if (percent.value >= 80) return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
});
/** Unclamped percentage for text: usage above a lowered cap reads 200%. */
const rawPercent = computed(() =>
  // toFixed first so 1.025 * 100 (102.49999…) still rounds to 103.
  props.row.ratio == null
    ? 0
    : Math.round(Number((props.row.ratio * 100).toFixed(4))),
);
const valueText = computed(
  () => `${usedText.value} of ${hardText.value} (${rawPercent.value}%)`,
);
</script>

<template>
  <div
    class="flex flex-col gap-1 min-w-0"
    :data-resource="row.resource"
    :data-percent="percent"
  >
    <div class="flex items-baseline justify-between gap-2 text-xs">
      <span v-if="!compact" class="font-medium">{{ label }}</span>
      <span
        v-if="capped"
        class="tabular-nums truncate"
        :class="textClass"
        :title="valueText"
        data-testid="quota-text"
      >
        {{ usedText }} / {{ hardText }}
      </span>
      <span v-else class="text-muted-foreground" data-testid="quota-text">
        {{ t('status.no_quota') }}
      </span>
    </div>
    <div
      v-if="capped"
      class="h-1.5 w-full rounded-full overflow-hidden bg-muted dark:bg-zinc-700"
      role="progressbar"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuetext="valueText"
      :aria-label="label"
    >
      <div
        class="h-full transition-all duration-300"
        :class="barClass"
        :style="{ width: `${percent}%` }"
        data-testid="quota-fill"
      />
    </div>
  </div>
</template>
