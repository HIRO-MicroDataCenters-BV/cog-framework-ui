<script setup lang="ts">
/**
 * Side sheet showing the log tail of a training job's primary replica
 * (`GET /cogapi/training-jobs/{id}/logs`). Refetches on open and on the
 * refresh button; the backend answers with an empty list plus `message`
 * while no pod exists yet or its container is still starting.
 */
import { ref, watch } from 'vue';
import AppSheet from '@/components/app/AppSheet.vue';
import Button from '@/components/ui/button/Button.vue';
import { useApi } from '@/composables/api';
import type { TrainingJob, TrainingJobLogs } from '~/types/api.types';

const props = defineProps<{
  open: boolean;
  job: TrainingJob | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const { getTrainingJobLogs } = useApi();
const { t } = useI18n();

const loading = ref(false);
const lines = ref<string[]>([]);
const note = ref<string | null>(null);
const replica = ref('');

let loadId = 0;

const fetchLogs = async () => {
  const job = props.job;
  if (!job) return;
  const id = ++loadId;
  loading.value = true;
  try {
    const res = await getTrainingJobLogs(job.id, { tail: 500 });
    if (id !== loadId) return;
    const data = (res?.data ?? null) as TrainingJobLogs | null;
    lines.value = data?.lines ?? [];
    note.value = data?.message ?? null;
    replica.value = data?.replica ?? '';
  } catch (err) {
    if (id !== loadId) return;
    console.error('Failed to load training job logs', err);
    lines.value = [];
    note.value = t('message.error.operation_failed');
  } finally {
    if (id === loadId) loading.value = false;
  }
};

watch(
  () => [props.open, props.job?.id] as const,
  ([isOpen]) => {
    if (isOpen && props.job) {
      fetchLogs();
    } else {
      loadId += 1;
      lines.value = [];
      note.value = null;
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <AppSheet
    :open="open"
    :title="t('title.training_job_logs')"
    :description="job ? `${job.name} · ${job.job_name}` : ''"
    content-class="sm:max-w-3xl w-full"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <div class="flex min-h-0 flex-1 flex-col gap-2">
      <div
        class="flex shrink-0 items-center justify-between gap-2 px-3 py-2 bg-muted/40 border border-border rounded-t-lg"
      >
        <span class="text-xs font-mono truncate">
          {{ job?.job_name
          }}<template v-if="replica"> · {{ replica }}</template>
        </span>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 shrink-0"
          :disabled="loading"
          :aria-label="t('action.refresh')"
          data-testid="refresh-logs"
          @click="fetchLogs"
        >
          <Icon
            :name="loading ? 'lucide:loader-2' : 'lucide:refresh-cw'"
            class="h-3.5 w-3.5"
            :class="{ 'animate-spin': loading }"
          />
        </Button>
      </div>
      <div
        class="min-h-[50vh] flex-1 overflow-auto bg-black/5 dark:bg-black/30 border border-t-0 border-border rounded-b-lg p-3 font-mono text-xs whitespace-pre"
        data-testid="log-body"
      >
        <template v-if="loading && lines.length === 0">
          <span class="text-muted-foreground">{{ t('message.loading') }}</span>
        </template>
        <template v-else-if="lines.length">
          <pre class="m-0 p-0 whitespace-pre block min-w-max">{{
            lines.join('\n')
          }}</pre>
        </template>
        <template v-else>
          <span class="text-muted-foreground">{{
            note || t('hint.training_job_logs_empty')
          }}</span>
        </template>
      </div>
      <p v-if="lines.length && note" class="text-xs text-muted-foreground">
        {{ note }}
      </p>
    </div>
  </AppSheet>
</template>
