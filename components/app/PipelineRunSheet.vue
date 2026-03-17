<template>
  <AppSheet
    :open="open"
    :title="sheetTitle"
    side="right"
    content-class="w-full sm:max-w-xl"
    header-class="sr-only"
    @update:open="(v) => emit('update:open', v)"
  >
    <div v-if="run" class="flex flex-col gap-4">
      <!-- Header -->
      <div
        class="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/60 dark:bg-muted/30 -mx-1"
      >
        <div class="min-w-0 flex-1">
          <h2 class="font-semibold text-sm text-foreground truncate">
            {{ sheetTitle }}
          </h2>
          <p class="text-[11px] text-muted-foreground truncate">
            {{ sheetSubtitle }}
          </p>
        </div>
        <span
          :class="[
            statusBadgeClass,
            'text-[10px] font-medium px-2 py-0.5 rounded shrink-0',
          ]"
        >
          {{ currentStatus }}
        </span>
      </div>

      <!-- Tabs -->
      <div class="border-b border-border/60 -mx-1 px-1">
        <nav class="flex gap-4 text-xs" aria-label="Pipeline run tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="pb-2 border-b-2 -mb-px transition-colors whitespace-nowrap"
            :class="
              activeTab === tab.key
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            "
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Input / Output -->
      <div v-if="activeTab === 'io'" class="space-y-6">
        <!-- Input parameters -->
        <section>
          <h3 class="text-sm font-semibold text-foreground mb-3">
            Input parameters
          </h3>
          <div v-if="inputParameters.length" class="divide-y border-t border-b">
            <div
              v-for="param in inputParameters"
              :key="param.name"
              class="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span class="font-semibold text-foreground shrink-0">
                {{ param.name }}
              </span>
              <span class="text-sm text-muted-foreground text-right break-all">
                {{ param.value }}
              </span>
            </div>
          </div>
        </section>

        <!-- Input artifacts -->
        <section>
          <h3 class="text-sm font-semibold text-foreground mb-3">
            Input artifacts
          </h3>
          <div v-if="inputArtifacts.length" class="divide-y border-t border-b">
            <div
              v-for="artifact in inputArtifacts"
              :key="artifact.name"
              class="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span class="font-semibold text-foreground shrink-0">
                {{ artifact.name }}
              </span>
              <span class="text-sm text-muted-foreground text-right break-all">
                {{ artifact.path }}
              </span>
            </div>
          </div>
        </section>

        <!-- Output parameters -->
        <section>
          <h3 class="text-sm font-semibold text-foreground mb-3">
            Output parameters
          </h3>
          <div
            v-if="outputParameters.length"
            class="divide-y border-t border-b"
          >
            <div
              v-for="param in outputParameters"
              :key="param.name"
              class="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span class="font-semibold text-foreground shrink-0">
                {{ param.name }}
              </span>
              <span class="text-sm text-muted-foreground text-right break-all">
                {{ param.value || '—' }}
              </span>
            </div>
          </div>
        </section>

        <!-- Output artifacts -->
        <section>
          <h3 class="text-sm font-semibold text-foreground mb-3">
            Output artifacts
          </h3>
          <div v-if="outputArtifacts.length" class="divide-y border-t border-b">
            <div
              v-for="artifact in outputArtifacts"
              :key="artifact.name"
              class="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span class="font-semibold text-foreground shrink-0">
                {{ artifact.name }}
              </span>
              <span
                class="text-xs text-muted-foreground text-right break-all font-mono"
              >
                {{ artifact.path }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <!-- Details -->
      <div v-else-if="activeTab === 'details'" class="space-y-3">
        <div class="rounded-lg border border-border/60 bg-card divide-y">
          <div
            class="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span class="text-muted-foreground shrink-0">Run ID</span>
            <CopyPaste :has-copy="true" :copy-text="run.run_id">
              <span class="font-mono text-xs break-all">{{ run.run_id }}</span>
            </CopyPaste>
          </div>
          <div
            class="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span class="text-muted-foreground shrink-0">Experiment ID</span>
            <CopyPaste :has-copy="true" :copy-text="run.experiment_id">
              <span class="font-mono text-xs break-all">
                {{ run.experiment_id }}
              </span>
            </CopyPaste>
          </div>
          <div
            class="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span class="text-muted-foreground shrink-0">Service account</span>
            <span class="text-xs font-medium">
              {{ run.service_account || '—' }}
            </span>
          </div>
          <div
            class="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span class="text-muted-foreground shrink-0">Created</span>
            <span class="text-xs font-medium">{{
              formatDate(run.created_at)
            }}</span>
          </div>
          <div
            class="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span class="text-muted-foreground shrink-0">Finished</span>
            <span class="text-xs font-medium">
              {{ formatDate(run.finished_at) }}
            </span>
          </div>
        </div>

        <section v-if="stateHistory.length" class="space-y-1.5">
          <h3
            class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            State history
          </h3>
          <div class="rounded-lg border border-border/60 bg-card divide-y">
            <div
              v-for="item in stateHistory"
              :key="item.update_time + item.state"
              class="flex items-center justify-between gap-3 px-3 py-2 text-xs"
            >
              <span class="text-muted-foreground">
                {{ formatDate(item.update_time) }}
              </span>
              <span class="font-medium">{{ item.state }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Logs (placeholder) -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground"
      >
        <Icon name="lucide:file-text" class="w-8 h-8 opacity-40" />
        <p class="text-sm">Logs will be available here</p>
      </div>
    </div>
  </AppSheet>
</template>

<script setup lang="ts">
import AppSheet from '@/components/app/AppSheet.vue';
import CopyPaste from '@/components/app/CopyPaste.vue';

const { t } = useI18n();

interface PipelineParameter {
  name: string;
  value?: string;
}

interface PipelineArtifact {
  name: string;
  path?: string;
  from?: string;
}

interface PipelineOutputParameter {
  name: string;
  valueFrom?: { path?: string };
}

interface PipelineOutputArtifact {
  name: string;
  path?: string;
}

interface DagTask {
  template: string;
  arguments?: { parameters?: PipelineParameter[] };
}

interface PipelineTemplate {
  name: string;
  metadata?: { annotations?: Record<string, string> };
  inputs?: {
    parameters?: PipelineParameter[];
    artifacts?: PipelineArtifact[];
  };
  outputs?: {
    parameters?: PipelineOutputParameter[];
    artifacts?: PipelineOutputArtifact[];
  };
  dag?: { tasks?: DagTask[] };
}

interface StateHistoryEntry {
  update_time: string;
  state: string;
}

interface TaskDetail {
  run_id: string;
  task_id: string;
  display_name: string;
  create_time?: string;
  start_time?: string;
  end_time?: string;
  state?: string;
  output_values?: Record<string, string>;
  state_history?: StateHistoryEntry[];
}

interface PipelineRun {
  run_id: string;
  display_name?: string;
  experiment_id?: string;
  state?: string;
  service_account?: string;
  created_at?: string;
  scheduled_at?: string;
  finished_at?: string;
  runtime_config?: { parameters?: Record<string, string> };
  run_details?: { task_details?: TaskDetail[] };
  state_history?: StateHistoryEntry[];
  pipeline_spec?: {
    spec?: {
      templates?: PipelineTemplate[];
      arguments?: { parameters?: PipelineParameter[] };
    };
  };
}

const props = defineProps<{
  open: boolean;
  run: PipelineRun | null;
  selectedNodeName?: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const activeTab = ref<'io' | 'details' | 'logs'>('io');

// Reset to io tab whenever the selected node changes
watch(
  () => props.selectedNodeName,
  () => {
    activeTab.value = 'io';
  },
);

const tabs = [
  { key: 'io', label: 'Input/Output' },
  { key: 'details', label: 'Details' },
  { key: 'logs', label: 'Logs' },
] as const;

const run = computed(() => props.run);

// Find the template matching the clicked node
const selectedTemplate = computed(() => {
  if (!props.selectedNodeName || !run.value) return null;
  const templates: PipelineTemplate[] =
    run.value?.pipeline_spec?.spec?.templates ?? [];
  return templates.find((t) => t.name === props.selectedNodeName) ?? null;
});

// Find the task_detail for this node
const selectedTask = computed(() => {
  if (!props.selectedNodeName || !run.value) return null;
  const tasks: TaskDetail[] = run.value?.run_details?.task_details ?? [];
  return tasks.find((t) => t.display_name === props.selectedNodeName) ?? null;
});

// Find the DAG entry for this template to resolve actual argument values
const dagTask = computed(() => {
  if (!props.selectedNodeName || !run.value) return null;
  const templates: PipelineTemplate[] =
    run.value?.pipeline_spec?.spec?.templates ?? [];
  for (const tpl of templates) {
    if (!tpl.dag?.tasks) continue;
    const found = tpl.dag.tasks.find(
      (t: DagTask) => t.template === props.selectedNodeName,
    );
    if (found) return found;
  }
  return null;
});

const sheetTitle = computed(() => {
  if (selectedTemplate.value) {
    // Use task display name from annotations if available
    const displayName =
      selectedTemplate.value?.metadata?.annotations?.[
        'pipelines.kubeflow.org/task_display_name'
      ];
    return displayName || props.selectedNodeName || 'Task';
  }
  return run.value?.display_name || run.value?.run_id || 'Pipeline run';
});

const sheetSubtitle = computed(() => {
  if (props.selectedNodeName) return props.selectedNodeName;
  return run.value?.experiment_id || '';
});

const currentStatus = computed(() => {
  if (selectedTask.value) return selectedTask.value.state || 'UNKNOWN';
  return run.value?.state || 'UNKNOWN';
});

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  } catch {
    return value;
  }
};

const statusBadgeClass = computed(() => {
  const state = currentStatus.value.toLowerCase();
  if (state === 'succeeded')
    return 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100';
  if (state === 'failed')
    return 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100';
  if (state === 'running')
    return 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100';
});

// Resolve parameter value — handles {{inputs.parameters.x}} references
const resolveParamValue = (rawValue: string): string => {
  if (!rawValue) return '';
  const runtimeParams: Record<string, string> =
    run.value?.runtime_config?.parameters ?? {};
  const argsParams: PipelineParameter[] =
    run.value?.pipeline_spec?.spec?.arguments?.parameters ?? [];

  const argsMap = new Map<string, string>();
  argsParams.forEach((p) => {
    if (p?.name) argsMap.set(p.name, p.value ?? '');
  });

  // Merge runtime over args
  Object.entries(runtimeParams).forEach(([k, v]) => argsMap.set(k, String(v)));

  // Resolve {{inputs.parameters.x}} references
  return rawValue.replace(
    /\{\{\s*inputs\.parameters\.([a-zA-Z0-9_]+)\s*\}\}/g,
    (_, paramName) => argsMap.get(paramName) ?? `{{${paramName}}}`,
  );
};

// INPUT PARAMETERS
// For a specific node: use the DAG task's argument values (resolved)
// Fallback: pipeline-level runtime_config parameters
const inputParameters = computed(() => {
  if (selectedTemplate.value) {
    const paramDefs: PipelineParameter[] =
      selectedTemplate.value.inputs?.parameters ?? [];
    const dagArgMap = new Map<string, string>();
    (dagTask.value?.arguments?.parameters ?? []).forEach(
      (p: PipelineParameter) => {
        if (p?.name) dagArgMap.set(p.name, p.value ?? '');
      },
    );

    return paramDefs.map((def: PipelineParameter) => ({
      name: def.name,
      value: resolveParamValue(dagArgMap.get(def.name) ?? ''),
    }));
  }

  // Pipeline-level fallback
  const runtimeParams: Record<string, string> =
    run.value?.runtime_config?.parameters ?? {};
  const argsParams: PipelineParameter[] =
    run.value?.pipeline_spec?.spec?.arguments?.parameters ?? [];
  const map = new Map<string, string>();
  argsParams.forEach((p: PipelineParameter) => {
    if (p?.name) map.set(p.name, p.value ?? '');
  });
  Object.entries(runtimeParams).forEach(([k, v]) => map.set(k, String(v)));

  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
});

// INPUT ARTIFACTS (from template inputs.artifacts)
const inputArtifacts = computed(() => {
  if (!selectedTemplate.value) return [];
  return (selectedTemplate.value.inputs?.artifacts ?? []).map(
    (a: PipelineArtifact) => ({
      name: a.name,
      path: a.path ?? a.from ?? '—',
    }),
  );
});

// OUTPUT PARAMETERS
// Use actual computed values from task output_values (mock/API) when available,
// otherwise fall back to the path defined in the template spec.
const outputParameters = computed(() => {
  if (selectedTemplate.value) {
    const outputValues: Record<string, string> =
      selectedTask.value?.output_values ?? {};

    return (selectedTemplate.value.outputs?.parameters ?? []).map(
      (p: PipelineOutputParameter) => {
        // Prefer actual value from execution result, fall back to path
        const actual = outputValues[p.name];
        return {
          name: p.name,
          value: actual ?? p.valueFrom?.path ?? '—',
        };
      },
    );
  }

  // Pipeline-level: collect all template output params
  const templates: PipelineTemplate[] =
    run.value?.pipeline_spec?.spec?.templates ?? [];
  const all: Array<{ name: string; value: string }> = [];
  templates.forEach((tpl: PipelineTemplate) => {
    (tpl.outputs?.parameters ?? []).forEach((p: PipelineOutputParameter) => {
      all.push({ name: p.name, value: p.valueFrom?.path ?? '—' });
    });
  });
  return all;
});

// OUTPUT ARTIFACTS
const outputArtifacts = computed(() => {
  if (selectedTemplate.value) {
    return (selectedTemplate.value.outputs?.artifacts ?? []).map(
      (a: PipelineOutputArtifact) => ({
        name: a.name,
        path: a.path ?? '—',
      }),
    );
  }
  return [];
});

const stateHistory = computed<StateHistoryEntry[]>(
  () => run.value?.state_history ?? [],
);
</script>

<script lang="ts">
export default {
  name: 'PipelineRunSheet',
};
</script>
