<script setup lang="ts">
import { useApp } from '~/composables/app';
import { useDashboard } from '~/composables/useDashboard';
import { useCurrentUser } from '~/composables/useCurrentUser';

import HealthBadge from '~/components/app/dashboard/HealthBadge.vue';
import KpiCard from '~/components/app/dashboard/KpiCard.vue';
import ServingTable from '~/components/app/dashboard/ServingTable.vue';
import RunsChart from '~/components/app/dashboard/RunsChart.vue';
import InventoryPanel from '~/components/app/dashboard/InventoryPanel.vue';
import GrowthTrends from '~/components/app/dashboard/GrowthTrends.vue';
import OwnersTable from '~/components/app/dashboard/OwnersTable.vue';

const { setPage } = useApp();
const { user: currentUser } = useCurrentUser();

// Admin guard — only admin@hiro.com can view this page (known tech debt: hardcoded string).
// Skipped in mock/demo mode where the seeded user is not the admin account.
const router = useRouter();
const config = useRuntimeConfig();
const mockEnabled = config.public.mockEnabled;
watchEffect(() => {
  if (
    !mockEnabled &&
    currentUser.value &&
    currentUser.value.email !== 'admin@hiro.com'
  ) {
    router.replace('/datasets');
  }
});

setPage({ section: 'dashboard' });

const {
  kpis,
  servingRows,
  runBuckets,
  datasetTypeStats,
  modelTypeStats,
  growthSeries,
  ownerStats,
  loading,
  error,
  anyLoading,
  refresh,
} = useDashboard();

const kpiCards = computed(() => [
  {
    key: 'models' as const,
    label: 'Models in Registry',
    value: kpis.value.modelsTotal,
    icon: 'lucide:bot',
    color: 'text-blue-500',
  },
  {
    key: 'serving' as const,
    label: 'Live Deployments',
    value: kpis.value.liveDeployments,
    icon: 'lucide:server',
    color: 'text-green-500',
  },
  {
    key: 'datasets' as const,
    label: 'Datasets Registered',
    value: kpis.value.datasetsTotal,
    icon: 'lucide:table-2',
    color: 'text-purple-500',
  },
  {
    key: 'runs' as const,
    label: 'Pipeline Runs (7d)',
    value: kpis.value.pipelineRuns7d,
    icon: 'lucide:route',
    color: 'text-orange-500',
  },
  {
    key: 'experiments' as const,
    label: 'Experiments',
    value: kpis.value.experimentsTotal,
    icon: 'lucide:flask-conical',
    color: 'text-teal-500',
  },
  {
    key: 'users' as const,
    label: 'Platform Users',
    value: kpis.value.usersTotal,
    icon: 'lucide:users',
    color: 'text-indigo-500',
  },
]);
</script>

<template>
  <div class="flex flex-col gap-3 p-6 min-h-full">
    <!-- ── Page header ─────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">
          Executive Dashboard
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          Key metrics and trends across the Cognitive Framework platform
        </p>
      </div>
      <div class="flex items-center gap-3">
        <HealthBadge
          :healthy="kpis.platformHealthy"
          :loading="loading.health"
          :error="error.health"
        />

        <!-- Refresh -->
        <button
          class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
          :class="{ 'opacity-50 pointer-events-none': anyLoading }"
          @click="refresh"
        >
          <Icon
            name="lucide:refresh-cw"
            class="size-3"
            :class="{ 'animate-spin': anyLoading }"
          />
          Refresh
        </button>
      </div>
    </div>

    <!-- ── Row 1: KPI cards ────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiCard
        v-for="card in kpiCards"
        :key="card.key"
        :label="card.label"
        :value="card.value"
        :icon="card.icon"
        :color="card.color"
        :loading="loading[card.key]"
        :error="error[card.key]"
        :error-title="
          card.key === 'users' ? 'Requires admin access' : 'Failed to load'
        "
      />
    </div>

    <!-- ── Row 2: Serving table (60%) + Pipeline runs (40%) ── -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-3">
      <div class="lg:col-span-3">
        <ServingTable
          :rows="servingRows"
          :loading="loading.serving"
          :error="error.serving"
        />
      </div>
      <div class="lg:col-span-2">
        <RunsChart
          :buckets="runBuckets"
          :loading="loading.runs"
          :error="error.runs"
        />
      </div>
    </div>

    <!-- ── Row 3: Dataset inventory + Model inventory (side by side) ── -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <InventoryPanel
        title="Dataset Inventory"
        header-icon="lucide:table-2"
        header-color="text-purple-500"
        unit="datasets"
        :stats="datasetTypeStats"
        :total="kpis.datasetsTotal"
        :loading="loading.datasets"
        :error="error.datasets"
        empty-text="No datasets registered"
      />
      <InventoryPanel
        title="Model Inventory"
        header-icon="lucide:bot"
        header-color="text-blue-500"
        unit="models"
        :stats="modelTypeStats"
        :total="kpis.modelsTotal"
        :loading="loading.models"
        :error="error.models"
        empty-text="No models registered"
      />
    </div>

    <!-- ── Row 4: Growth trends (50%) + Assets by owner (50%) ── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <GrowthTrends
        :series="growthSeries"
        :loading="loading.models || loading.datasets"
        :error="error.models && error.datasets"
      />
      <OwnersTable
        :owners="ownerStats"
        :loading="loading.models || loading.datasets"
        :error="error.models && error.datasets"
      />
    </div>
  </div>
</template>
