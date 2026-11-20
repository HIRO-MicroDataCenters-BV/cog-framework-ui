<script setup lang="ts">
/**
 * The caller's resource quota at a glance: one bar per capped resource.
 *
 * Renders nothing when there is no status or no quota is set, so pages can
 * mount it unconditionally above the list of things that consume resources
 * (servings, training jobs, fine-tunes). The frame and icon take the tone
 * of the worst resource (calm, amber from 80%, red at the cap), a hint shows
 * while the cluster has not yet mirrored a changed quota, and the
 * pod-admission caveat is spelled out at the cap, because that is where an
 * over-quota workload actually fails.
 */
import type { QuotaStatus } from '~/types/api.types';
import QuotaBar from '~/components/app/QuotaBar.vue';

const props = defineProps<{
  status: QuotaStatus | null;
}>();

const { t } = useI18n();

const visible = computed(() => Boolean(props.status?.enabled));
const rows = computed(() =>
  (props.status?.resources ?? []).filter((r) => r.hard !== null),
);
const worst = computed(() =>
  rows.value.reduce((max, r) => Math.max(max, r.ratio ?? 0), 0),
);
const overQuota = computed(() => worst.value >= 1);
const nearQuota = computed(() => !overQuota.value && worst.value >= 0.8);
const tone = computed(() =>
  overQuota.value ? 'over' : nearQuota.value ? 'near' : 'ok',
);
/** The card's frame and icon echo the worst resource's state. */
const toneClass = computed(() => {
  if (overQuota.value) return 'border-red-500/40 bg-red-500/5';
  if (nearQuota.value) return 'border-amber-500/40 bg-amber-500/5';
  return 'border-border/60 bg-card';
});
const iconClass = computed(() => {
  if (overQuota.value) return 'text-red-600 dark:text-red-400';
  if (nearQuota.value) return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
});
</script>

<template>
  <section
    v-if="visible && status"
    class="rounded-xl border px-4 py-3 transition-colors"
    :class="toneClass"
    :data-tone="tone"
    data-testid="quota-usage-card"
  >
    <div class="flex items-center justify-between gap-3 mb-2">
      <div class="flex items-center gap-2 min-w-0">
        <Icon name="lucide:gauge" class="size-4 shrink-0" :class="iconClass" />
        <h2 class="text-sm font-semibold truncate">
          {{ t('title.resource_quota') }}
        </h2>
        <span
          class="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground truncate"
        >
          <Icon name="lucide:folder-tree" class="size-3" />
          {{ status.namespace }}
        </span>
      </div>
      <span
        v-if="!status.synced"
        class="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
        data-testid="quota-not-synced"
      >
        <Icon name="lucide:loader-circle" class="size-3 animate-spin" />
        {{ t('hint.quota_not_synced') }}
      </span>
    </div>
    <div class="grid gap-x-6 gap-y-2 sm:grid-cols-3">
      <QuotaBar v-for="row in rows" :key="row.resource" :row="row" />
    </div>
    <p
      v-if="overQuota"
      class="mt-2 inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
      data-testid="quota-over"
    >
      <Icon name="lucide:octagon-alert" class="size-3.5 shrink-0" />
      {{ t('hint.quota_pod_rejection') }}
    </p>
  </section>
</template>
