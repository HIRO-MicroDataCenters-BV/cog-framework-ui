<script setup lang="ts">
/**
 * The caller's resource quota at a glance: one bar per capped resource.
 *
 * Renders nothing when there is no status or no quota is set, so pages can
 * mount it unconditionally above the list of things that consume resources
 * (servings, training jobs, fine-tunes). Shows a hint while the cluster has
 * not yet mirrored a changed quota, and the pod-admission caveat, because
 * that is where an over-quota workload actually fails.
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
const overQuota = computed(() => rows.value.some((r) => (r.ratio ?? 0) >= 1));
</script>

<template>
  <section
    v-if="visible && status"
    class="rounded-xl border border-border/60 bg-card px-4 py-3"
    data-testid="quota-usage-card"
  >
    <div class="flex items-center justify-between gap-3 mb-2">
      <div class="flex items-center gap-2 min-w-0">
        <Icon
          name="lucide:gauge"
          class="size-4 text-muted-foreground shrink-0"
        />
        <h2 class="text-sm font-semibold truncate">
          {{ t('title.resource_quota') }}
        </h2>
        <span class="text-xs text-muted-foreground font-mono truncate">
          {{ status.namespace }}
        </span>
      </div>
      <span
        v-if="!status.synced"
        class="text-xs text-amber-600 dark:text-amber-400"
        data-testid="quota-not-synced"
      >
        {{ t('hint.quota_not_synced') }}
      </span>
    </div>
    <div class="grid gap-x-6 gap-y-2 sm:grid-cols-3">
      <QuotaBar v-for="row in rows" :key="row.resource" :row="row" />
    </div>
    <p
      v-if="overQuota"
      class="mt-2 text-xs text-red-600 dark:text-red-400"
      data-testid="quota-over"
    >
      {{ t('hint.quota_pod_rejection') }}
    </p>
  </section>
</template>
