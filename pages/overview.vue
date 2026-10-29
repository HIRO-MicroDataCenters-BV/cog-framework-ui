<script setup lang="ts">
import { useApp } from '~/composables/app';
import { useOverview } from '~/composables/useOverview';

import KpiCard from '~/components/app/dashboard/KpiCard.vue';
import RecentRuns from '~/components/app/overview/RecentRuns.vue';
import Recommendations from '~/components/app/overview/Recommendations.vue';
import ExamplePipelines from '~/components/app/overview/ExamplePipelines.vue';

const { setPage } = useApp();

setPage({ section: 'overview' });

const { user } = useCurrentUser();
const {
  overview,
  examples,
  loading,
  failed,
  refresh,
  isUnavailable,
  subtitle,
  kpis,
} = useOverview();

onMounted(refresh);

const displayName = computed(
  () => (user.value?.name || overview.value?.user_id || '').split('@')[0],
);
</script>

<template>
  <div class="flex flex-col gap-3 p-6 min-h-full">
    <!-- ── Page header ─────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">
          Welcome back<template v-if="displayName"
            >, {{ displayName }}</template
          >
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ subtitle || 'Your workspace at a glance' }}
        </p>
      </div>
      <button
        class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
        :class="{ 'opacity-50 pointer-events-none': loading }"
        @click="refresh"
      >
        <Icon
          name="lucide:refresh-cw"
          class="size-3"
          :class="{ 'animate-spin': loading }"
        />
        Refresh
      </button>
    </div>

    <!-- ── Row 1: KPI cards ────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div v-for="kpi in kpis" :key="kpi.key" class="flex flex-col">
        <KpiCard
          :label="kpi.label"
          :value="kpi.value"
          :suffix="kpi.suffix"
          :to="kpi.to"
          :icon="kpi.icon"
          :color="kpi.color"
          :loading="loading"
          :error="kpi.error"
          error-title="Not available right now"
        />
        <span
          v-if="!loading && !kpi.error && kpi.hint"
          class="px-2 pt-1 text-[11px]"
          :class="{
            'text-green-600 dark:text-green-400': kpi.tone === 'up',
            'text-red-600 dark:text-red-400': kpi.tone === 'down',
            'text-muted-foreground': kpi.tone === 'neutral',
          }"
        >
          {{ kpi.hint }}
        </span>
      </div>
    </div>

    <!-- ── Row 2: Recent runs (60%) + Recommendations (40%) ── -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-3">
      <div class="lg:col-span-3">
        <RecentRuns
          :runs="overview?.recent_runs ?? []"
          :loading="loading"
          :error="isUnavailable('runs')"
        />
      </div>
      <div class="lg:col-span-2">
        <Recommendations
          :recommendations="overview?.recommendations ?? []"
          :loading="loading"
        />
      </div>
    </div>

    <!-- ── Row 3: Example pipelines ─────────────────────────── -->
    <ExamplePipelines v-if="examples.length" :examples="examples" />

    <p
      v-if="failed && !loading"
      class="text-xs text-muted-foreground"
      role="status"
    >
      The overview could not be loaded. Try Refresh in a moment.
    </p>
  </div>
</template>
