<script setup lang="ts">
/**
 * Federated analyses.
 *
 * The participants and their data products are chosen in the dataspace,
 * which hands over an order (`?order_id=…`). Here the user only picks which
 * platform analysis runs on that order, then follows the run and reads its
 * results (for Federated GWAS: a Manhattan plot and an association table).
 *
 * Without an order the page still lists earlier runs; hospitals can be
 * entered by hand as a debug input when the backend allows it.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { useApi } from '@/composables/api';
import { Button } from '~/components/ui/button';
import { isRunStateInFlight } from '~/utils/runStates';
import type {
  FederatedAnalysis,
  FederatedAnalysisArtifact,
  FederatedAnalysisParty,
  FederatedAnalysisResult,
  FederatedAnalysisRun,
  FederatedAnalysisRunCreateParams,
} from '~/types/api.types';

const { t } = useI18n();
const route = useRoute();
const { setPage } = useApp();
const {
  getFederatedAnalyses,
  getFederatedAnalysisOrder,
  getFederatedAnalysisRuns,
  getFederatedAnalysisRun,
  getFederatedAnalysisResult,
  startFederatedAnalysisRun,
  getArtifactPreview,
} = useApi();

setPage({
  section: 'federated-analyses',
  description: t('description.federated_analyses'),
});

/** How often runs are re-read while one is still going. */
const RUN_POLL_MS = 5000;
/** Rows of the association table shown before "download" is the better tool. */
const TABLE_PREVIEW_ROWS = 100;

// ---------------------------------------------------------------- order
type PartyRow = {
  institution: string;
  data_url: string;
  num_individuals: number | null;
};

// Read off the route so a query-only navigation (another order, or none)
// switches the participants too.
const orderId = computed(() => String(route.query.order_id ?? '').trim());
const orderParties = ref<PartyRow[]>([]);
const orderError = ref('');
const orderLoading = ref(false);

const manualParties = ref<PartyRow[]>([
  { institution: '', data_url: '', num_individuals: null },
  { institution: '', data_url: '', num_individuals: null },
]);
const usingOrder = computed(() => orderId.value !== '');
const parties = computed(() =>
  usingOrder.value ? orderParties.value : manualParties.value,
);

const loadOrder = async () => {
  const requested = orderId.value;
  orderError.value = '';
  orderParties.value = [];
  orderLoading.value = requested !== '';
  if (!requested) return;
  try {
    const res = await getFederatedAnalysisOrder(requested);
    // The order in the URL changed while this one was loading.
    if (orderId.value !== requested) return;
    const found = (res?.data?.parties ?? []) as FederatedAnalysisParty[];
    orderParties.value = found.map((p) => ({
      institution: p.institution,
      data_url: p.data_url,
      num_individuals: p.num_individuals ?? null,
    }));
    if (!found.length)
      orderError.value = 'No participants found for this order.';
  } finally {
    if (orderId.value === requested) orderLoading.value = false;
  }
};

watch(orderId, () => void loadOrder());

const addManualParty = () =>
  manualParties.value.push({
    institution: '',
    data_url: '',
    num_individuals: null,
  });
const removeManualParty = (index: number) =>
  manualParties.value.splice(index, 1);

// -------------------------------------------------------------- analysis
const analyses = ref<FederatedAnalysis[]>([]);
const analysisId = ref('');
const presetId = ref('');
const runName = ref('');
const submitting = ref(false);

const analysis = computed(() =>
  analyses.value.find((a) => a.id === analysisId.value),
);
const preset = computed(() =>
  analysis.value?.presets.find((p) => p.id === presetId.value),
);

const selectAnalysis = (id: string) => {
  analysisId.value = id;
  const picked = analyses.value.find((a) => a.id === id);
  presetId.value = picked?.default_preset ?? picked?.presets[0]?.id ?? '';
};

const loadAnalyses = async () => {
  const res = await getFederatedAnalyses();
  analyses.value = (res?.data ?? []) as FederatedAnalysis[];
  if (analyses.value.length && !analysisId.value) {
    selectAnalysis(analyses.value[0].id);
  }
};

/** A cohort size the backend accepts: a whole number of at least one. */
const isCohortSize = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const formProblem = computed(() => {
  const picked = analysis.value;
  if (!picked) return 'Choose an analysis.';
  if (!runName.value.trim()) return 'Give the run a name.';
  const rows = parties.value;
  if (rows.length < picked.min_parties) {
    return `${picked.title} needs at least ${picked.min_parties} participants.`;
  }
  if (rows.some((p) => !p.institution.trim() || !p.data_url.trim())) {
    return 'Every participant needs a name and a data location.';
  }
  if (
    picked.requires_cohort_sizes &&
    rows.some((p) => !isCohortSize(p.num_individuals))
  ) {
    return 'Enter the number of individuals (a whole number, 1 or more) for every participant.';
  }
  return '';
});

const startRun = async () => {
  if (formProblem.value || !analysis.value) return;
  const body: FederatedAnalysisRunCreateParams = {
    name: runName.value.trim(),
    preset: presetId.value || undefined,
  };
  if (usingOrder.value) {
    body.order_id = orderId.value;
    body.num_individuals = Object.fromEntries(
      orderParties.value
        .filter((p) => isCohortSize(p.num_individuals))
        .map((p) => [p.institution, p.num_individuals as number]),
    );
  } else {
    body.parties = manualParties.value.map((p) => ({
      institution: p.institution.trim(),
      data_url: p.data_url.trim(),
      num_individuals: isCohortSize(p.num_individuals)
        ? p.num_individuals
        : undefined,
    }));
  }
  submitting.value = true;
  try {
    const res = await startFederatedAnalysisRun(analysis.value.id, body);
    if (res?.data) {
      runName.value = '';
      await loadRuns();
      void openRun(res.data as FederatedAnalysisRun);
    }
  } finally {
    submitting.value = false;
  }
};

// ------------------------------------------------------------------ runs
const runs = ref<FederatedAnalysisRun[]>([]);
const runsLoaded = ref(false);

/** Settled states of an analysis run or step beyond the shared run states. */
const EXTRA_TERMINAL_STATES = new Set(['ERROR', 'TERMINATED', 'OMITTED']);

const isActive = (status?: string | null) =>
  isRunStateInFlight(status) &&
  !EXTRA_TERMINAL_STATES.has(String(status ?? '').toUpperCase());

const isSucceeded = (status?: string | null) =>
  String(status ?? '').toUpperCase() === 'SUCCEEDED';

const statusClass = (status?: string | null) => {
  const key = String(status ?? '').toLowerCase();
  if (key === 'succeeded') {
    return 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100';
  }
  if (key === 'failed' || key === 'error') {
    return 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100';
  }
  if (key === 'running') {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100';
  }
  return 'bg-muted text-muted-foreground';
};

const loadRuns = async () => {
  const res = await getFederatedAnalysisRuns();
  // A failed poll returns null: keep the rows already shown.
  if (res && Array.isArray(res.data)) {
    runs.value = res.data as FederatedAnalysisRun[];
    runsLoaded.value = true;
  }
};

// ---------------------------------------------------------------- result
const openedRun = ref<FederatedAnalysisRun | null>(null);
const result = ref<FederatedAnalysisResult | null>(null);
const plotUrl = ref('');
const table = ref<{ headers: string[]; rows: string[][] } | null>(null);
// Artifacts never change once logged: each is fetched until it has loaded.
const loadedArtifacts = ref(new Set<string>());
const artifactsMissing = computed(() =>
  (result.value?.artifacts ?? []).some(
    (a) => !loadedArtifacts.value.has(a.url),
  ),
);

const analysisTitle = (id: string) =>
  analyses.value.find((a) => a.id === id)?.title ?? id;

const loadArtifacts = async (
  runId: string,
  artifacts: FederatedAnalysisArtifact[],
) => {
  for (const artifact of artifacts) {
    if (loadedArtifacts.value.has(artifact.url)) continue;
    const res = await getArtifactPreview(artifact.url);
    // Another run was opened while this preview was loading.
    if (openedRun.value?.run_id !== runId) return;
    const data = res?.data as
      | { type: string; url?: string; headers?: string[]; rows?: string[][] }
      | null
      | undefined;
    // A failed preview stays unloaded so the next refresh tries it again.
    if (!data) continue;
    if (data.type === 'image' && data.url) plotUrl.value = data.url;
    if (data.type === 'csv' && data.headers && data.rows) {
      table.value = { headers: data.headers, rows: data.rows };
    }
    loadedArtifacts.value.add(artifact.url);
  }
};

const refreshOpenedRun = async () => {
  const current = openedRun.value;
  if (!current) return;
  const [runRes, resultRes] = await Promise.all([
    getFederatedAnalysisRun(current.run_id),
    getFederatedAnalysisResult(current.run_id),
  ]);
  // The user may have opened another run while these were loading.
  if (openedRun.value?.run_id !== current.run_id) return;
  if (runRes?.data) openedRun.value = runRes.data as FederatedAnalysisRun;
  if (resultRes?.data) {
    result.value = resultRes.data as FederatedAnalysisResult;
    await loadArtifacts(current.run_id, result.value.artifacts ?? []);
  }
};

const openRun = async (run: FederatedAnalysisRun) => {
  openedRun.value = run;
  result.value = null;
  plotUrl.value = '';
  table.value = null;
  loadedArtifacts.value = new Set();
  await refreshOpenedRun();
};

const closeRun = () => {
  openedRun.value = null;
};

const downloadTable = () => {
  if (!table.value || !openedRun.value) return;
  const csv = [table.value.headers, ...table.value.rows]
    .map((row) => row.join(','))
    .join('\n');
  const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${openedRun.value.name}-association-results.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// --------------------------------------------------------------- polling
// A finished run is only worth re-reading while its results may still be
// on their way: it succeeded but they are not readable yet. A failed or
// cancelled run without results will never get any.
const needsPolling = computed(() => {
  if (runs.value.some((r) => isActive(r.status))) return true;
  const opened = openedRun.value;
  if (!opened) return false;
  return (
    isActive(opened.status) ||
    (isSucceeded(opened.status) && result.value?.ready === false)
  );
});

const { pause: pausePolling, resume: resumePolling } = useIntervalFn(
  () => {
    void loadRuns();
    void refreshOpenedRun();
  },
  RUN_POLL_MS,
  { immediate: false },
);

watch(
  needsPolling,
  (needed) => {
    if (needed) resumePolling();
    else pausePolling();
  },
  { immediate: true },
);

onMounted(() => {
  void loadAnalyses();
  void loadOrder();
  void loadRuns();
});
</script>

<template>
  <div class="flex flex-col gap-6 p-4" data-testid="federated-analyses">
    <!-- 1. Participants -->
    <section class="rounded-lg border p-4">
      <h2 class="mb-1 text-base font-semibold">1. Participants</h2>
      <template v-if="usingOrder">
        <p class="mb-3 text-sm text-muted-foreground">
          From dataspace order
          <span class="font-mono" data-testid="order-id">{{ orderId }}</span>
        </p>
        <p v-if="orderLoading" class="text-sm text-muted-foreground">
          Loading participants…
        </p>
        <p v-else-if="orderError" class="text-sm text-red-600">
          {{ orderError }}
        </p>
        <table v-else class="w-full text-sm" data-testid="order-parties">
          <thead class="text-left text-muted-foreground">
            <tr>
              <th class="py-1 pr-4 font-medium">Participant</th>
              <th class="py-1 pr-4 font-medium">Data product</th>
              <th class="py-1 font-medium">Individuals</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="party in orderParties" :key="party.data_url">
              <td class="py-1 pr-4 font-medium">{{ party.institution }}</td>
              <td
                class="max-w-0 w-full truncate py-1 pr-4 font-mono text-xs"
                :title="party.data_url"
              >
                {{ party.data_url }}
              </td>
              <td class="py-1">
                <input
                  v-model.number="party.num_individuals"
                  type="number"
                  min="1"
                  class="w-28 rounded-md border bg-background px-2 py-1"
                  :aria-label="`Individuals at ${party.institution}`"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </template>
      <template v-else>
        <p class="mb-3 text-sm text-muted-foreground">
          No dataspace order selected. Start from the dataspace to bring an
          order here, or enter the participants by hand (debug).
        </p>
        <div
          v-for="(party, index) in manualParties"
          :key="index"
          class="mb-2 flex flex-wrap items-center gap-2"
          data-testid="manual-party"
        >
          <input
            v-model="party.institution"
            placeholder="Institution"
            class="w-40 rounded-md border bg-background px-2 py-1 text-sm"
            :aria-label="`Institution ${index + 1}`"
          />
          <input
            v-model="party.data_url"
            placeholder="https://ds-connector…/chunk"
            class="min-w-64 flex-1 rounded-md border bg-background px-2 py-1 font-mono text-xs"
            :aria-label="`Data location ${index + 1}`"
          />
          <input
            v-model.number="party.num_individuals"
            type="number"
            min="1"
            placeholder="Individuals"
            class="w-28 rounded-md border bg-background px-2 py-1 text-sm"
            :aria-label="`Individuals ${index + 1}`"
          />
          <Button
            variant="ghost"
            size="sm"
            :disabled="manualParties.length <= 2"
            :aria-label="`Remove participant ${index + 1}`"
            @click="removeManualParty(index)"
          >
            <Icon name="lucide:x" class="size-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" @click="addManualParty">
          <Icon name="lucide:plus" class="mr-1 size-4" />
          Add participant
        </Button>
      </template>
    </section>

    <!-- 2. Analysis -->
    <section class="rounded-lg border p-4">
      <h2 class="mb-3 text-base font-semibold">2. Analysis</h2>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="item in analyses"
          :key="item.id"
          type="button"
          class="rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
          :class="
            item.id === analysisId ? 'border-primary ring-1 ring-primary' : ''
          "
          :aria-pressed="item.id === analysisId"
          data-testid="analysis-card"
          @click="selectAnalysis(item.id)"
        >
          <div class="font-medium">{{ item.title }}</div>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ item.description }}
          </p>
        </button>
      </div>

      <div v-if="analysis" class="mt-4 flex flex-wrap items-end gap-4">
        <label class="flex flex-col gap-1 text-sm">
          <span class="font-medium">Preset</span>
          <select
            v-model="presetId"
            class="rounded-md border bg-background px-2 py-1.5"
            data-testid="preset"
          >
            <option v-for="p in analysis.presets" :key="p.id" :value="p.id">
              {{ p.title }}
            </option>
          </select>
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="font-medium">Run name</span>
          <input
            v-model="runName"
            placeholder="gwas-demo"
            class="w-64 rounded-md border bg-background px-2 py-1.5"
            data-testid="run-name"
          />
        </label>
        <Button
          :disabled="!!formProblem || submitting"
          data-testid="start-run"
          @click="startRun"
        >
          <Icon name="lucide:play" class="mr-2 size-4" />
          Run analysis
        </Button>
      </div>
      <p v-if="preset" class="mt-2 text-sm text-muted-foreground">
        {{ preset.description }}
      </p>
      <p
        v-if="analysis && formProblem"
        class="mt-1 text-sm text-muted-foreground"
        data-testid="form-problem"
      >
        {{ formProblem }}
      </p>
    </section>

    <!-- 3. Runs -->
    <section class="rounded-lg border p-4">
      <h2 class="mb-3 text-base font-semibold">Runs</h2>
      <p
        v-if="runsLoaded && !runs.length"
        class="text-sm text-muted-foreground"
      >
        No analysis has been run yet.
      </p>
      <table v-else-if="runs.length" class="w-full text-sm" data-testid="runs">
        <thead class="text-left text-muted-foreground">
          <tr>
            <th class="py-1 pr-4 font-medium">Name</th>
            <th class="py-1 pr-4 font-medium">Analysis</th>
            <th class="py-1 pr-4 font-medium">Status</th>
            <th class="py-1 pr-4 font-medium">Started</th>
            <th class="py-1 pr-4 font-medium">Duration</th>
            <th class="py-1 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="run in runs"
            :key="run.run_id"
            class="border-t"
            :class="run.run_id === openedRun?.run_id ? 'bg-muted/40' : ''"
            data-testid="run-row"
          >
            <td class="py-2 pr-4 font-medium">{{ run.name }}</td>
            <td class="py-2 pr-4">{{ analysisTitle(run.analysis_id) }}</td>
            <td class="py-2 pr-4">
              <span
                class="inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium"
                :class="statusClass(run.status)"
                data-testid="run-status"
              >
                {{ run.status ?? 'Pending' }}
              </span>
            </td>
            <td class="py-2 pr-4 text-muted-foreground">
              {{
                run.start_time
                  ? run.start_time.replace('T', ' ').slice(0, 19)
                  : '-'
              }}
            </td>
            <td class="py-2 pr-4 text-muted-foreground">
              {{ run.duration ?? '-' }}
            </td>
            <td class="py-2 text-right">
              <Button
                variant="outline"
                size="sm"
                data-testid="open-run"
                @click="openRun(run)"
              >
                Results
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 4. Result of the opened run -->
    <section
      v-if="openedRun"
      class="rounded-lg border p-4"
      data-testid="run-result"
    >
      <div class="mb-3 flex items-center gap-3">
        <h2 class="text-base font-semibold">
          {{ openedRun.name }} — {{ analysisTitle(openedRun.analysis_id) }}
        </h2>
        <span
          class="inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium"
          :class="statusClass(openedRun.status)"
        >
          {{ openedRun.status ?? 'Pending' }}
        </span>
        <div class="flex-1" />
        <NuxtLink
          :to="`/pipelines/${openedRun.run_id}`"
          class="text-sm text-primary underline-offset-2 hover:underline"
        >
          Open pipeline run
        </NuxtLink>
        <Button variant="ghost" size="sm" aria-label="Close" @click="closeRun">
          <Icon name="lucide:x" class="size-4" />
        </Button>
      </div>

      <ul
        v-if="openedRun.steps?.length"
        class="mb-4 flex flex-wrap gap-2"
        data-testid="run-steps"
      >
        <li
          v-for="step in openedRun.steps"
          :key="step.id ?? step.name ?? ''"
          class="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
        >
          <span class="font-mono">{{ step.name }}</span>
          <span
            class="rounded px-1 py-0.5 font-medium"
            :class="statusClass(step.status)"
          >
            {{ step.status ?? 'Pending' }}
          </span>
        </li>
      </ul>

      <p
        v-if="!result?.ready"
        class="text-sm text-muted-foreground"
        data-testid="result-pending"
      >
        {{
          isActive(openedRun.status) || isSucceeded(openedRun.status)
            ? 'Results appear here when the analysis finishes.'
            : 'This run did not log any results.'
        }}
      </p>
      <template v-else>
        <dl class="mb-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div v-for="(value, key) in result.params" :key="`p-${key}`">
            <dt class="text-muted-foreground">{{ key }}</dt>
            <dd class="font-medium">{{ value }}</dd>
          </div>
          <div v-for="(value, key) in result.metrics" :key="`m-${key}`">
            <dt class="text-muted-foreground">{{ key }}</dt>
            <dd class="font-medium tabular-nums">{{ value }}</dd>
          </div>
        </dl>

        <img
          v-if="plotUrl"
          :src="plotUrl"
          alt="Manhattan plot"
          class="mb-4 w-full rounded-md border bg-white"
          data-testid="manhattan-plot"
        />

        <p
          v-if="artifactsMissing"
          class="mb-4 flex items-center gap-3 text-sm text-muted-foreground"
          data-testid="artifacts-missing"
        >
          Some results could not be loaded.
          <Button variant="outline" size="sm" @click="refreshOpenedRun">
            Try again
          </Button>
        </p>

        <div v-if="table" data-testid="association-table">
          <div class="mb-2 flex items-center gap-3">
            <h3 class="text-sm font-semibold">Association results</h3>
            <span class="text-xs text-muted-foreground">
              {{ table.rows.length }} variants<template
                v-if="table.rows.length > TABLE_PREVIEW_ROWS"
                >, first {{ TABLE_PREVIEW_ROWS }} shown</template
              >
            </span>
            <div class="flex-1" />
            <Button variant="outline" size="sm" @click="downloadTable">
              <Icon name="lucide:download" class="mr-1 size-4" />
              Download CSV
            </Button>
          </div>
          <div class="max-h-96 overflow-auto rounded-md border">
            <table class="w-full text-sm tabular-nums">
              <thead class="sticky top-0 bg-background text-left">
                <tr>
                  <th
                    v-for="header in table.headers"
                    :key="header"
                    class="px-3 py-1.5 font-medium"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in table.rows.slice(
                    0,
                    TABLE_PREVIEW_ROWS,
                  )"
                  :key="index"
                  class="border-t"
                >
                  <td v-for="(cell, c) in row" :key="c" class="px-3 py-1">
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>
