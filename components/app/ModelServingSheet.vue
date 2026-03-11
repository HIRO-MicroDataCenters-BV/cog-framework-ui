<template>
  <AppSheet
    :open="open"
    :title="serving?.isvc_name || 'Model serving'"
    description="Model serving details"
    header-class="sr-only"
    side="right"
    content-class="w-full sm:max-w-lg"
    @update:open="(v) => emit('update:open', v)"
  >
    <div v-if="serving" class="flex flex-col gap-3">
      <!-- Hero header -->
      <div
        class="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 dark:bg-muted/20 -mx-1"
      >
        <div
          class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 dark:bg-primary/20 text-primary"
        >
          <Icon name="lucide:server" class="w-4 h-4" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="font-semibold text-foreground truncate">
            {{ serving.isvc_name }}
          </h2>
          <Badge
            :class="statusBadgeClass"
            class="mt-0.5 text-[10px] font-medium"
          >
            {{ serving.status }}
          </Badge>
        </div>
      </div>

      <!-- Model -->
      <section class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Icon name="lucide:box" class="w-3.5 h-3.5 text-muted-foreground" />
          <h3
            class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Model
          </h3>
        </div>
        <div
          class="rounded-lg border border-border/60 bg-card p-2.5 space-y-1.5 text-sm"
        >
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Name</span>
            <span
              class="font-medium text-foreground text-right truncate"
              :title="serving.model_name ?? undefined"
            >
              {{ serving.model_name ?? '—' }}
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Version</span>
            <span class="font-medium text-foreground text-right">
              {{ serving.model_version ? `v${serving.model_version}` : '—' }}
            </span>
          </div>
          <div class="flex justify-between items-center gap-3">
            <span class="text-muted-foreground shrink-0">Model ID</span>
            <CopyPaste
              :has-copy="!!serving.model_id"
              :copy-text="serving.model_id ?? ''"
              icon-left
              class="font-mono text-xs font-medium text-foreground text-right break-all min-w-0 gap-0 shrink-0"
            >
              <span class="break-all">{{ serving.model_id ?? '—' }}</span>
            </CopyPaste>
          </div>
          <div class="flex justify-between items-center gap-3">
            <span class="text-muted-foreground shrink-0">Dataset ID</span>
            <CopyPaste
              :has-copy="!!serving.dataset_id"
              :copy-text="serving.dataset_id ?? ''"
              icon-left
              class="font-mono text-xs font-medium text-foreground text-right break-all min-w-0 gap-0 shrink-0"
            >
              <span class="break-all">{{ serving.dataset_id ?? '—' }}</span>
            </CopyPaste>
          </div>
        </div>
      </section>

      <!-- Canary rollout (separate section) -->
      <section v-if="serving.has_canary" class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Icon
            name="lucide:git-branch-plus"
            class="w-3.5 h-3.5 text-amber-500"
          />
          <h3
            class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Canary rollout
          </h3>
        </div>
        <div
          class="rounded-lg border border-amber-400/50 bg-amber-400/10 dark:bg-amber-400/15 p-2.5 space-y-1.5 text-sm"
        >
          <div class="flex items-center justify-between gap-2 text-xs">
            <span
              class="font-medium text-amber-800 dark:text-amber-100 flex items-center gap-1.5"
            >
              <span
                class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"
              />
              Canary version
            </span>
            <span class="font-semibold text-foreground">
              {{
                serving.canary_model_version
                  ? `v${serving.canary_model_version}`
                  : serving.model_version
                    ? `v${serving.model_version}`
                    : '—'
              }}
            </span>
          </div>
          <div class="flex justify-between items-center gap-3 text-xs">
            <span class="text-muted-foreground shrink-0">Canary model ID</span>
            <CopyPaste
              :has-copy="!!serving.canary_model_id"
              :copy-text="serving.canary_model_id ?? ''"
              icon-left
              class="font-mono text-[10px] font-medium text-foreground text-right break-all min-w-0 gap-0 shrink-0"
            >
              <span class="break-all">{{
                serving.canary_model_id ?? '—'
              }}</span>
            </CopyPaste>
          </div>
          <div class="flex justify-between gap-3 text-xs">
            <span class="text-muted-foreground shrink-0">Canary revision</span>
            <span
              class="font-mono text-[10px] font-medium text-foreground text-right break-all min-w-0"
            >
              {{ serving.canary_revision ?? '—' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Deployment -->
      <section class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Icon
            name="lucide:rocket"
            class="w-3.5 h-3.5 text-muted-foreground"
          />
          <h3
            class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Deployment
          </h3>
        </div>
        <div
          class="rounded-lg border border-border/60 bg-card p-2.5 space-y-1.5 text-sm"
        >
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Latest revision</span>
            <span
              class="font-mono text-xs font-medium text-foreground text-right break-all min-w-0"
            >
              {{ serving.latest_ready_revision ?? '—' }}
            </span>
          </div>
          <template v-if="serving.has_canary">
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground shrink-0"
                >Stable revision</span
              >
              <span
                class="font-mono text-xs font-medium text-foreground text-right break-all min-w-0"
              >
                {{ serving.stable_revision ?? '—' }}
              </span>
            </div>
          </template>
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Traffic</span>
            <span class="font-medium text-foreground text-right"
              >{{ serving.traffic_percentage ?? 0 }}%</span
            >
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Age</span>
            <span class="font-medium text-foreground text-right tabular-nums">{{
              serving.age ?? '—'
            }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Created</span>
            <span class="font-medium text-foreground text-right">{{
              formatDate(serving.creation_timestamp)
            }}</span>
          </div>
        </div>
      </section>

      <!-- Endpoint -->
      <section class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Icon name="lucide:link" class="w-3.5 h-3.5 text-muted-foreground" />
          <h3
            class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Endpoint
          </h3>
        </div>
        <div class="rounded-lg border border-border/60 bg-card p-2.5">
          <CopyPaste
            :has-copy="true"
            :copy-text="serving.served_model_url ?? ''"
            class="block"
          >
            <span
              class="text-xs text-muted-foreground hover:text-foreground break-all cursor-pointer transition-colors font-mono"
            >
              {{ serving.served_model_url ?? '—' }}
            </span>
          </CopyPaste>
        </div>
      </section>

      <!-- Edit -->
      <Button variant="outline" class="w-full" @click="emit('edit', serving)">
        <Icon name="lucide:sliders-horizontal" class="w-4 h-4 mr-2" />
        Edit traffic split
      </Button>

      <!-- Delete -->
      <Button
        variant="outline"
        class="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
        @click="emit('delete', serving)"
      >
        <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
        {{ t('action.delete_model_service') }}
      </Button>
    </div>
  </AppSheet>
</template>

<script setup lang="ts">
import AppSheet from '@/components/app/AppSheet.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CopyPaste from '@/components/app/CopyPaste.vue';
import type { ModelServing } from '~/types/model.types';
import { useDayjs, useI18n } from '#imports';

const { t } = useI18n();

const props = defineProps<{
  open: boolean;
  serving: ModelServing | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'edit', serving: ModelServing): void;
  (e: 'delete', serving: ModelServing): void;
}>();

const dayjs = useDayjs();

const statusBadgeClass = computed(() => {
  if (!props.serving) return '';
  const s = props.serving.status?.toLowerCase();
  if (s === 'ready')
    return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  if (s === 'pending')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  if (s === 'failed')
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  if (s === 'unknown')
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300';
  if (s === 'terminating')
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
  return 'bg-muted text-muted-foreground';
});

function formatDate(timestamp: string | undefined): string {
  if (!timestamp) return '—';
  return dayjs(timestamp).format('DD MMM YYYY, HH:mm');
}
</script>
