<script setup lang="ts">
import OverviewPanel from './OverviewPanel.vue';
import type { OverviewRecentRun } from '~/types/overview.types';
import { statusPillClass, timeAgo } from '~/utils/overview';

defineProps<{
  runs: OverviewRecentRun[];
  loading: boolean;
  error: boolean;
}>();
</script>

<template>
  <OverviewPanel
    title="Recent pipeline runs"
    icon="lucide:route"
    icon-color="text-orange-500"
  >
    <ul v-if="loading" class="divide-y divide-border/20">
      <li v-for="i in 5" :key="i" class="px-4 py-3">
        <span class="inline-block h-3 w-2/3 rounded bg-muted animate-pulse" />
      </li>
    </ul>
    <p v-else-if="error" class="px-4 py-6 text-xs text-muted-foreground">
      Pipeline runs are not available right now.
    </p>
    <p v-else-if="!runs.length" class="px-4 py-6 text-xs text-muted-foreground">
      No runs yet.
    </p>
    <ul v-else class="divide-y divide-border/20">
      <li v-for="run in runs" :key="run.run_id ?? run.run_name ?? ''">
        <NuxtLink
          :to="run.run_id ? `/pipelines/${run.run_id}` : '/pipelines/run'"
          class="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/60"
        >
          <span
            class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
            :class="statusPillClass(run.status)"
          >
            {{ run.status || 'unknown' }}
          </span>
          <span class="flex-1 truncate text-sm font-medium">
            {{ run.run_name || run.run_id }}
          </span>
          <span class="shrink-0 text-xs text-muted-foreground tabular-nums">
            {{ run.duration }} · {{ timeAgo(run.start_time) }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </OverviewPanel>
</template>
