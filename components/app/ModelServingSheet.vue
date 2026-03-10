<template>
  <AppSheet
    :open="open"
    @update:open="(v) => emit('update:open', v)"
    title=""
    description=""
    side="right"
    content-class="w-full sm:max-w-lg"
  >
    <div v-if="serving" class="flex flex-col gap-5">
      <!-- Hero header -->
      <div class="flex items-center gap-3 p-4 rounded-lg bg-muted/50 dark:bg-muted/20 -mx-1">
        <div
          class="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center bg-primary/10 dark:bg-primary/20 text-primary"
        >
          <Icon name="lucide:server" class="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="font-semibold text-foreground truncate">
            {{ serving.isvc_name }}
          </h2>
          <Badge :class="statusBadgeClass" class="mt-1 text-[10px] font-medium">
            {{ serving.status }}
          </Badge>
        </div>
      </div>

      <!-- Model (single when no canary) -->
      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <Icon name="lucide:box" class="w-4 h-4 text-muted-foreground" />
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Model
          </h3>
        </div>
        <template v-if="!serving.has_canary">
          <div class="rounded-lg border border-border/60 bg-card p-3 space-y-2.5 text-sm">
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground shrink-0">Name</span>
              <span class="font-medium text-foreground text-right truncate" :title="serving.model_name ?? undefined">
                {{ serving.model_name ?? '—' }}
              </span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground shrink-0">Version</span>
              <span class="font-medium text-foreground text-right">
                {{ serving.model_version ? `v${serving.model_version}` : '—' }}
              </span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground shrink-0">Model ID</span>
              <span class="font-mono text-xs font-medium text-foreground text-right truncate max-w-[180px]" :title="serving.model_id ?? undefined">
                {{ serving.model_id ?? '—' }}
              </span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground shrink-0">Dataset ID</span>
              <span class="font-mono text-xs font-medium text-foreground text-right truncate max-w-[180px]" :title="serving.dataset_id ?? undefined">
                {{ serving.dataset_id ?? '—' }}
              </span>
            </div>
          </div>
        </template>
        <!-- Stable & Canary when has_canary -->
        <template v-else>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <!-- Stable -->
            <div class="rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 p-3 space-y-2.5 text-sm">
              <div class="flex items-center gap-2 mb-1">
                <span class="inline-flex h-2 w-2 rounded-full bg-primary" />
                <span class="text-xs font-semibold text-foreground">Stable</span>
                <span class="text-[10px] text-muted-foreground">({{ serving.stable_traffic_percent ?? 0 }}% traffic)</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground shrink-0 text-xs">Name</span>
                <span class="font-medium text-foreground text-right truncate text-xs" :title="serving.model_name ?? undefined">
                  {{ serving.model_name ?? '—' }}
                </span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground shrink-0 text-xs">Version</span>
                <span class="font-medium text-foreground text-right text-xs">
                  {{ serving.model_version ? `v${serving.model_version}` : '—' }}
                </span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground shrink-0 text-xs">Model ID</span>
                <span class="font-mono text-[10px] font-medium text-foreground text-right truncate max-w-[120px]" :title="serving.model_id ?? undefined">
                  {{ serving.model_id ?? '—' }}
                </span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground shrink-0 text-xs">Revision</span>
                <span class="font-mono text-[10px] font-medium text-foreground text-right truncate max-w-[120px]" :title="serving.stable_revision ?? undefined">
                  {{ serving.stable_revision ?? '—' }}
                </span>
              </div>
            </div>
            <!-- Canary -->
            <div class="rounded-lg border border-amber-400/40 bg-amber-400/10 dark:bg-amber-400/15 p-3 space-y-2.5 text-sm">
              <div class="flex items-center gap-2 mb-1">
                <span class="inline-flex h-2 w-2 rounded-full bg-amber-500" />
                <span class="text-xs font-semibold text-foreground">Canary</span>
                <span class="text-[10px] text-muted-foreground">({{ serving.canary_traffic_percent ?? 0 }}% traffic)</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground shrink-0 text-xs">Model</span>
                <span class="font-medium text-foreground text-right truncate text-xs" :title="serving.model_name ?? undefined">
                  {{ serving.model_name ?? '—' }}
                </span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground shrink-0 text-xs">Version</span>
                <span class="font-medium text-foreground text-right text-xs">
                  {{ serving.canary_model_version ? `v${serving.canary_model_version}` : (serving.model_version ? `v${serving.model_version}` : '—') }}
                </span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground shrink-0 text-xs">Model ID</span>
                <span class="font-mono text-[10px] font-medium text-foreground text-right truncate max-w-[120px]" :title="serving.canary_model_id ?? undefined">
                  {{ serving.canary_model_id ?? '—' }}
                </span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-muted-foreground shrink-0 text-xs">Revision</span>
                <span class="font-mono text-[10px] font-medium text-foreground text-right truncate max-w-[120px]" :title="serving.canary_revision ?? undefined">
                  {{ serving.canary_revision ?? '—' }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="serving.dataset_id" class="rounded-lg border border-border/60 bg-card p-2.5 text-sm">
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground shrink-0 text-xs">Dataset ID</span>
              <span class="font-mono text-xs font-medium text-foreground text-right truncate" :title="serving.dataset_id">
                {{ serving.dataset_id }}
              </span>
            </div>
          </div>
        </template>
      </section>

      <!-- Deployment -->
      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <Icon name="lucide:rocket" class="w-4 h-4 text-muted-foreground" />
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Deployment
          </h3>
        </div>
        <div class="rounded-lg border border-border/60 bg-card p-3 space-y-2.5 text-sm">
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Latest revision</span>
            <span class="font-mono text-xs font-medium text-foreground text-right truncate max-w-[180px]" :title="serving.latest_ready_revision">
              {{ serving.latest_ready_revision ?? '—' }}
            </span>
          </div>
          <template v-if="serving.has_canary">
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground shrink-0">Stable revision</span>
              <span class="font-mono text-xs font-medium text-foreground text-right truncate max-w-[180px]" :title="serving.stable_revision ?? undefined">
                {{ serving.stable_revision ?? '—' }}
              </span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground shrink-0">Canary revision</span>
              <span class="font-mono text-xs font-medium text-foreground text-right truncate max-w-[180px]" :title="serving.canary_revision ?? undefined">
                {{ serving.canary_revision ?? '—' }}
              </span>
            </div>
            <!-- Traffic bar -->
            <div class="pt-1">
              <div class="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Canary {{ serving.canary_traffic_percent ?? 0 }}%</span>
                <span>Stable {{ serving.stable_traffic_percent ?? 100 }}%</span>
              </div>
              <div class="h-1.5 rounded-full overflow-hidden bg-muted flex">
                <div
                  class="bg-amber-400/80 transition-all"
                  :style="{ width: `${serving.canary_traffic_percent ?? 0}%` }"
                />
                <div
                  class="bg-primary/80 transition-all"
                  :style="{ width: `${serving.stable_traffic_percent ?? 100}%` }"
                />
              </div>
            </div>
          </template>
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Traffic</span>
            <span class="font-medium text-foreground text-right">{{ serving.traffic_percentage ?? 0 }}%</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Age</span>
            <span class="font-medium text-foreground text-right tabular-nums">{{ serving.age ?? '—' }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-muted-foreground shrink-0">Created</span>
            <span class="font-medium text-foreground text-right">{{ formatDate(serving.creation_timestamp) }}</span>
          </div>
        </div>
      </section>

      <!-- Endpoint -->
      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <Icon name="lucide:link" class="w-4 h-4 text-muted-foreground" />
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Endpoint
          </h3>
        </div>
        <div class="rounded-lg border border-border/60 bg-card p-3">
          <CopyPaste :has-copy="true" :copy-text="serving.served_model_url ?? ''" class="block">
            <span
              class="text-xs text-muted-foreground hover:text-foreground break-all cursor-pointer transition-colors font-mono"
            >
              {{ serving.served_model_url ?? '—' }}
            </span>
          </CopyPaste>
        </div>
      </section>

      <!-- Edit -->
      <Button
        variant="outline"
        class="w-full"
        @click="emit('edit', serving)"
      >
        <Icon name="lucide:sliders-horizontal" class="w-4 h-4 mr-2" />
        Edit traffic split
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
import { useDayjs } from '#imports';

const props = defineProps<{
  open: boolean;
  serving: ModelServing | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'edit', serving: ModelServing): void;
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
