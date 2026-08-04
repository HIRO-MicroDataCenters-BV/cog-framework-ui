import { useIntervalFn } from '@vueuse/core';

// useApi() returns a large inferred object; cast to any to access all methods without TS narrowing limits
type AnyApi = ReturnType<typeof useApi> &
  Record<string, (...args: unknown[]) => Promise<unknown>>;

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export interface DashboardKpis {
  modelsTotal: number;
  liveDeployments: number;
  datasetsTotal: number;
  pipelineRuns7d: number;
  experimentsTotal: number;
  usersTotal: number;
  platformHealthy: boolean | null;
}

export interface ServingRow {
  isvcName: string;
  modelName: string | null;
  framework: string | null;
  owner: string | null;
  status: string;
  hasCanary: boolean;
  stableTraffic: number | null;
  canaryTraffic: number | null;
  createdAt: string;
  age: string;
}

export interface RunBucket {
  label: string;
  succeeded: number;
  running: number;
  failed: number;
  skipped: number;
  total: number;
}

export interface OwnerStat {
  email: string;
  name: string;
  models: number;
  datasets: number;
  total: number;
}

export interface DatasetTypeStat {
  type: string;
  label: string;
  count: number;
  icon: string;
  colorClass: string;
}

export interface ModelTypeStat {
  type: string;
  label: string;
  count: number;
  icon: string;
  colorClass: string;
  // Populated only for the "Other" bucket: the raw types folded into it.
  members?: { label: string; count: number }[];
}

// Registrations per month, for the growth trend chart.
export interface GrowthPoint {
  month: string;
  models: number;
  datasets: number;
}

// Per-widget loading flags so a slow endpoint never blocks a fast widget.
export interface DashboardLoading {
  health: boolean;
  models: boolean;
  serving: boolean;
  datasets: boolean;
  runs: boolean;
  experiments: boolean;
  users: boolean;
}

// Per-widget error flags so a failed endpoint shows an inline error, not a stuck spinner.
export interface DashboardError {
  health: boolean;
  models: boolean;
  serving: boolean;
  datasets: boolean;
  runs: boolean;
  experiments: boolean;
  users: boolean;
}

export const useDashboard = () => {
  const api = useApi() as AnyApi;

  const kpis = ref<DashboardKpis>({
    modelsTotal: 0,
    liveDeployments: 0,
    datasetsTotal: 0,
    pipelineRuns7d: 0,
    experimentsTotal: 0,
    usersTotal: 0,
    platformHealthy: null,
  });

  const servingRows = ref<ServingRow[]>([]);
  const runBuckets = ref<RunBucket[]>([]);
  const datasetTypeStats = ref<DatasetTypeStat[]>([]);
  const modelTypeStats = ref<ModelTypeStat[]>([]);
  // Monthly registration counts, keyed "YYYY-MM", captured from the models/datasets
  // stats endpoints and merged into the growth chart.
  const modelsByMonth = ref<Record<string, number>>({});
  const datasetsByMonth = ref<Record<string, number>>({});

  // Owner attribution — counts are captured separately by the models/datasets
  // fetches (which run in parallel) and merged into a sorted leaderboard.
  const modelOwnerCounts = ref<Record<string, number>>({});
  const datasetOwnerCounts = ref<Record<string, number>>({});

  const nameFromEmail = (email: string): string => {
    const part = email.split('@')[0];
    return part
      .replace(/[._]/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Stats endpoints return `by_owner: [{user_id, count}]` and
  // `by_month: [{month, count}]` — normalise both to `{ key: count }` maps.
  const ownerArrayToMap = (arr: unknown): Record<string, number> => {
    const out: Record<string, number> = {};
    if (Array.isArray(arr)) {
      for (const o of arr) {
        const id = String((o as { user_id?: unknown })?.user_id ?? '').trim();
        if (id) out[id] = Number((o as { count?: unknown })?.count) || 0;
      }
    }
    return out;
  };
  const monthArrayToMap = (arr: unknown): Record<string, number> => {
    const out: Record<string, number> = {};
    if (Array.isArray(arr)) {
      for (const it of arr) {
        const m = String((it as { month?: unknown })?.month ?? '').trim();
        if (m) out[m] = Number((it as { count?: unknown })?.count) || 0;
      }
    }
    return out;
  };

  const ownerStats = computed<OwnerStat[]>(() => {
    const merged: Record<string, { models: number; datasets: number }> = {};
    for (const [email, n] of Object.entries(modelOwnerCounts.value)) {
      merged[email] = { models: n, datasets: 0 };
    }
    for (const [email, n] of Object.entries(datasetOwnerCounts.value)) {
      if (!merged[email]) merged[email] = { models: 0, datasets: 0 };
      merged[email].datasets = n;
    }
    return Object.entries(merged)
      .map(([email, c]) => ({
        email,
        name: nameFromEmail(email),
        models: c.models,
        datasets: c.datasets,
        total: c.models + c.datasets,
      }))
      .sort((a, b) => b.total - a.total);
  });

  // Growth chart — merge the models/datasets monthly counts into the last 6
  // contiguous months (zero-filled). Derived from the stats endpoints, so no
  // separate growth call is needed.
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const growthSeries = computed<GrowthPoint[]>(() => {
    const mm = modelsByMonth.value;
    const dm = datasetsByMonth.value;
    const keys = [...new Set([...Object.keys(mm), ...Object.keys(dm)])].sort();
    if (keys.length === 0) return [];
    const latest = keys[keys.length - 1]; // "YYYY-MM"
    let [y, mo] = latest.split('-').map(Number);
    const seq: string[] = [];
    for (let i = 0; i < 6; i++) {
      seq.unshift(`${y}-${String(mo).padStart(2, '0')}`);
      mo -= 1;
      if (mo === 0) {
        mo = 12;
        y -= 1;
      }
    }
    return seq.map((k) => ({
      month: monthNames[Number(k.split('-')[1]) - 1],
      models: mm[k] ?? 0,
      datasets: dm[k] ?? 0,
    }));
  });

  const loading = ref<DashboardLoading>({
    health: true,
    models: true,
    serving: true,
    datasets: true,
    runs: true,
    experiments: true,
    users: true,
  });
  const error = ref<DashboardError>({
    health: false,
    models: false,
    serving: false,
    datasets: false,
    runs: false,
    experiments: false,
    users: false,
  });
  const lastUpdated = ref<Date | null>(null);

  // Dataset source types — the stats endpoint returns backend labels
  // (file / table / broker / nats / prometheus); older numeric mappings kept too.
  const typeIconMap: Record<string, string> = {
    file: 'lucide:file-text',
    table: 'lucide:table-2',
    broker: 'lucide:radio',
    nats: 'lucide:antenna',
    prometheus: 'lucide:activity',
    database: 'lucide:database',
    stream: 'lucide:radio',
    time_series: 'lucide:calendar',
  };
  const typeColorMap: Record<string, string> = {
    file: 'text-blue-600 dark:text-blue-400',
    table: 'text-purple-600 dark:text-purple-400',
    broker: 'text-orange-600 dark:text-orange-400',
    nats: 'text-teal-600 dark:text-teal-400',
    prometheus: 'text-green-600 dark:text-green-400',
    database: 'text-purple-600 dark:text-purple-400',
    stream: 'text-orange-600 dark:text-orange-400',
    time_series: 'text-green-600 dark:text-green-400',
  };
  const typeNameMap: Record<string, string> = {
    file: 'File',
    table: 'Table',
    broker: 'Broker',
    nats: 'NATS',
    prometheus: 'Prometheus',
    database: 'Database',
    stream: 'Stream',
    time_series: 'Time Series',
  };
  const prettify = (s: string) =>
    s.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Model framework presentation — nicer labels + a distinct icon/colour per
  // framework so the Model Inventory reads like the Dataset Inventory.
  // Raw backend `type` values are inconsistent (framework / task / noise), so we
  // fold them into a curated set of canonical categories. Anything unrecognised
  // lands in the "other" bucket. Keys on the right must exist in the maps below.
  const frameworkCanonicalMap: Record<string, string> = {
    pytorch: 'pytorch',
    torch: 'pytorch',
    tensorflow: 'tensorflow',
    tf: 'tensorflow',
    keras: 'keras',
    sklearn: 'sklearn',
    'scikit-learn': 'sklearn',
    scikit_learn: 'sklearn',
    xgboost: 'xgboost',
    xcboost: 'xgboost', // common typo in the registry
    xgb: 'xgboost',
    pyfunc: 'pyfunc',
    llm: 'llm',
    classification: 'classification',
  };
  const frameworkNameMap: Record<string, string> = {
    pytorch: 'PyTorch',
    tensorflow: 'TensorFlow',
    keras: 'Keras',
    sklearn: 'scikit-learn',
    xgboost: 'XGBoost',
    pyfunc: 'PyFunc',
    llm: 'LLM',
    classification: 'Classification',
    other: 'Other',
  };
  const frameworkIconMap: Record<string, string> = {
    pytorch: 'lucide:flame',
    tensorflow: 'lucide:brain',
    keras: 'lucide:layers',
    sklearn: 'lucide:git-fork',
    xgboost: 'lucide:trees',
    pyfunc: 'lucide:function-square',
    llm: 'lucide:sparkles',
    classification: 'lucide:tags',
    other: 'lucide:shapes',
  };
  const frameworkColorMap: Record<string, string> = {
    pytorch: 'text-orange-600 dark:text-orange-400',
    tensorflow: 'text-amber-600 dark:text-amber-400',
    keras: 'text-red-600 dark:text-red-400',
    sklearn: 'text-blue-600 dark:text-blue-400',
    xgboost: 'text-green-600 dark:text-green-400',
    pyfunc: 'text-purple-600 dark:text-purple-400',
    llm: 'text-indigo-600 dark:text-indigo-400',
    classification: 'text-cyan-600 dark:text-cyan-400',
    other: 'text-slate-500 dark:text-slate-400',
  };

  // ── Independent per-widget fetchers ───────────────────────────────────────
  // Each owns its loading/error flag and updates its slice of state the moment
  // it resolves — none awaits another, so widgets paint as their data arrives.

  const fetchHealth = async () => {
    loading.value.health = true;
    error.value.health = false;
    try {
      const res = await api.getHealth();
      kpis.value.platformHealthy =
        (res as { status_code?: number })?.status_code === 200;
    } catch {
      error.value.health = true;
      kpis.value.platformHealthy = false;
    } finally {
      loading.value.health = false;
    }
  };

  const fetchServing = async () => {
    loading.value.serving = true;
    error.value.serving = false;
    try {
      const res = await api.getModelsServing({ limit: 1000 });
      const rawServing =
        (res as { data?: Record<string, unknown>[] })?.data ?? [];
      kpis.value.liveDeployments = rawServing.filter(
        (s) => String(s.status).toLowerCase() === 'ready',
      ).length;
      servingRows.value = rawServing.map((s) => ({
        isvcName: String(s.isvc_name ?? ''),
        modelName: s.model_name ? String(s.model_name) : null,
        framework: s.model_type ? String(s.model_type) : null,
        owner: s.user_id ? String(s.user_id) : null,
        status: String(s.status ?? 'unknown').toLowerCase(),
        hasCanary: Boolean(s.has_canary),
        stableTraffic:
          s.stable_traffic_percent != null
            ? Number(s.stable_traffic_percent)
            : null,
        canaryTraffic:
          s.canary_traffic_percent != null
            ? Number(s.canary_traffic_percent)
            : null,
        createdAt: String(s.creation_timestamp ?? ''),
        age: String(s.age ?? ''),
      }));
    } catch {
      error.value.serving = true;
    } finally {
      loading.value.serving = false;
    }
  };

  // Lightweight stats endpoint — counts only, no dataset rows transferred.
  const fetchDatasets = async () => {
    loading.value.datasets = true;
    error.value.datasets = false;
    try {
      const res = await api.getDatasetsStats();
      const d = (res as { data?: Record<string, unknown> })?.data ?? {};
      kpis.value.datasetsTotal = Number(d.total ?? 0);

      // Dataset Inventory — breakdown by source type.
      const bySource = (d.by_source_type as Record<string, number>) ?? {};
      datasetTypeStats.value = Object.entries(bySource)
        .filter(([, count]) => Number(count) > 0)
        .map(([type, count]) => ({
          type,
          label: typeNameMap[type] ?? prettify(type),
          count: Number(count),
          icon: typeIconMap[type] ?? 'lucide:layers',
          colorClass: typeColorMap[type] ?? 'text-muted-foreground',
        }))
        .sort((a, b) => b.count - a.count);

      // Assets-by-Owner + growth chart inputs.
      datasetOwnerCounts.value = ownerArrayToMap(d.by_owner);
      datasetsByMonth.value = monthArrayToMap(d.by_month);
    } catch {
      error.value.datasets = true;
    } finally {
      loading.value.datasets = false;
    }
  };

  const fetchRuns = async () => {
    loading.value.runs = true;
    error.value.runs = false;
    try {
      // Use dashboard-specific mock that has recent dates; fall back to real V2 endpoint
      const res =
        'getPipelineRunsListV2Dashboard' in api
          ? await api.getPipelineRunsListV2Dashboard({ limit: 500 })
          : await api.getPipelineRunsListV2({ limit: 500 });
      const rawRuns =
        (res as { runs?: Record<string, unknown>[] })?.runs ??
        (res as { data?: Record<string, unknown>[] })?.data ??
        [];
      const now = Date.now();
      const ms7d = 7 * 24 * 60 * 60 * 1000;
      const ms30d = 30 * 24 * 60 * 60 * 1000;

      // Field names differ by source: the raw KFP/mock shape uses created_at,
      // while getPipelineRunsListV2 maps each run to start_time. Read either.
      const runTs = (r: Record<string, unknown>): number => {
        const raw =
          r.created_at ?? r.start_time ?? r.scheduled_at ?? r.finished_at;
        return raw ? new Date(String(raw)).getTime() : 0;
      };

      kpis.value.pipelineRuns7d = rawRuns.filter((r) => {
        const ts = runTs(r);
        return ts > 0 && now - ts <= ms7d;
      }).length;

      // 6 weekly buckets over 30 days
      const bucketCount = 6;
      const bucketMs = ms30d / bucketCount;
      const bucketList: RunBucket[] = Array.from(
        { length: bucketCount },
        (_, i) => ({
          label: `W${bucketCount - i}`,
          succeeded: 0,
          running: 0,
          failed: 0,
          skipped: 0,
          total: 0,
        }),
      );
      for (const r of rawRuns) {
        const ts = runTs(r);
        if (ts <= 0) continue;
        const age = now - ts;
        if (age > ms30d) continue;
        const bucketIdx = Math.min(Math.floor(age / bucketMs), bucketCount - 1);
        const bucket = bucketList[bucketIdx];
        const state = String(r.state ?? r.status ?? '').toUpperCase();
        bucket.total++;
        if (state === 'SUCCEEDED') bucket.succeeded++;
        else if (state === 'RUNNING') bucket.running++;
        else if (state === 'FAILED') bucket.failed++;
        else bucket.skipped++;
      }
      runBuckets.value = bucketList.reverse();
    } catch {
      error.value.runs = true;
    } finally {
      loading.value.runs = false;
    }
  };

  const fetchExperiments = async () => {
    loading.value.experiments = true;
    error.value.experiments = false;
    try {
      const res = await api.getExperimentsListV2({ limit: 1 });
      // Prefer the server-reported total; fall back to counting returned rows.
      const total =
        (res as { pagination?: { total_items?: number } })?.pagination
          ?.total_items ??
        (res as { data?: unknown[] })?.data?.length ??
        0;
      kpis.value.experimentsTotal = total;
    } catch {
      error.value.experiments = true;
    } finally {
      loading.value.experiments = false;
    }
  };

  const fetchUsers = async () => {
    loading.value.users = true;
    error.value.users = false;
    try {
      const res = await api.getUsers();
      const rawUsers = (res as { data?: unknown[] })?.data ?? [];
      kpis.value.usersTotal = rawUsers.length;
    } catch {
      // /users is admin-gated — a 403 for non-admins is expected, not a hard error
      error.value.users = true;
    } finally {
      loading.value.users = false;
    }
  };

  // Lightweight stats endpoint — counts only, no model rows transferred.
  const fetchModels = async () => {
    loading.value.models = true;
    error.value.models = false;
    try {
      const res = await api.getModelsStats();
      const d = (res as { data?: Record<string, unknown> })?.data ?? {};
      kpis.value.modelsTotal = Number(d.total ?? 0);

      // Model Inventory — fold raw `type` counts into curated categories + Other.
      const byType = (d.by_type as Record<string, number>) ?? {};
      const canonCount: Record<string, number> = {};
      const otherMembers: Record<string, number> = {};
      for (const [rawKey, cntRaw] of Object.entries(byType)) {
        const count = Number(cntRaw) || 0;
        const raw = String(rawKey).trim().toLowerCase();
        if (!raw || count === 0) continue;
        const canon = frameworkCanonicalMap[raw] ?? 'other';
        canonCount[canon] = (canonCount[canon] ?? 0) + count;
        if (canon === 'other') {
          otherMembers[raw] = (otherMembers[raw] ?? 0) + count;
        }
      }
      modelTypeStats.value = Object.entries(canonCount)
        .map(([type, count]) => ({
          type,
          label: frameworkNameMap[type] ?? prettify(type),
          count,
          icon: frameworkIconMap[type] ?? 'lucide:box',
          colorClass: frameworkColorMap[type] ?? 'text-muted-foreground',
          members:
            type === 'other'
              ? Object.entries(otherMembers)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, c]) => ({ label: prettify(label), count: c }))
              : undefined,
        }))
        // Sort by count desc, but always keep "Other" last.
        .sort((a, b) => {
          if (a.type === 'other') return 1;
          if (b.type === 'other') return -1;
          return b.count - a.count;
        });

      // Assets-by-Owner + growth chart inputs.
      modelOwnerCounts.value = ownerArrayToMap(d.by_owner);
      modelsByMonth.value = monthArrayToMap(d.by_month);
    } catch {
      error.value.models = true;
    } finally {
      loading.value.models = false;
    }
  };

  // Fire every widget's fetch at once; do NOT await them together so each paints
  // independently. lastUpdated stamps when the whole batch settles.
  const refresh = () => {
    const all = [
      fetchHealth(),
      fetchServing(),
      fetchDatasets(),
      fetchRuns(),
      fetchExperiments(),
      fetchUsers(),
      fetchModels(),
    ];
    Promise.allSettled(all).then(() => {
      lastUpdated.value = new Date();
    });
  };

  // True only while every widget is still loading (used for the header refresh spinner).
  const anyLoading = computed(() => Object.values(loading.value).some(Boolean));

  onMounted(() => {
    refresh();
  });

  useIntervalFn(refresh, REFRESH_MS);

  return {
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
    lastUpdated,
    refresh,
  };
};
