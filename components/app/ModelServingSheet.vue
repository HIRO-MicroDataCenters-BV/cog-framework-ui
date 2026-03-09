<template>
  <AppSheet
    :open="open"
    @update:open="(v) => emit('update:open', v)"
    :title="serving?.isvc_name ?? 'Served Model Details'"
    :description="serving ? `Status: ${serving.status}` : undefined"
    side="right"
    content-class="w-full sm:max-w-lg"
  >
    <div v-if="serving" class="flex flex-col gap-6">
        <!-- Model info -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Model
          </h3>
          <div class="grid gap-3 text-sm">
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Name</span>
              <span class="font-medium text-foreground truncate max-w-[200px] text-right">
                {{ serving.model_name ?? '—' }}
              </span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Version</span>
              <span class="font-medium text-foreground">
                {{ serving.model_version ? `v${serving.model_version}` : '—' }}
              </span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Model ID</span>
              <span
                class="font-mono text-xs text-foreground truncate max-w-[200px] text-right"
                :title="serving.model_id ?? undefined"
              >
                {{ serving.model_id ?? '—' }}
              </span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Dataset ID</span>
              <span
                class="font-mono text-xs text-foreground truncate max-w-[200px] text-right"
                :title="serving.dataset_id ?? undefined"
              >
                {{ serving.dataset_id ?? '—' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Revisions & traffic -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Deployment
          </h3>
          <div class="grid gap-3 text-sm">
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Latest revision</span>
              <span
                class="font-mono text-xs text-foreground truncate max-w-[200px] text-right"
                :title="serving.latest_ready_revision"
              >
                {{ serving.latest_ready_revision ?? '—' }}
              </span>
            </div>
            <div v-if="serving.has_canary" class="grid gap-2">
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">Stable revision</span>
                <span
                  class="font-mono text-xs text-foreground truncate max-w-[200px] text-right"
                  :title="serving.stable_revision ?? undefined"
                >
                  {{ serving.stable_revision ?? '—' }}
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">Canary revision</span>
                <span
                  class="font-mono text-xs text-foreground truncate max-w-[200px] text-right"
                  :title="serving.canary_revision ?? undefined"
                >
                  {{ serving.canary_revision ?? '—' }}
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">Traffic split</span>
                <span class="font-medium text-foreground">
                  Stable {{ serving.stable_traffic_percent ?? 100 }}% /
                  Canary {{ serving.canary_traffic_percent ?? 0 }}%
                </span>
              </div>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Traffic percentage</span>
              <span class="font-medium text-foreground">
                {{ serving.traffic_percentage ?? 0 }}%
              </span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Age</span>
              <span class="font-medium text-foreground tabular-nums">
                {{ serving.age ?? '—' }}
              </span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Created</span>
              <span class="font-medium text-foreground">
                {{ formatDate(serving.creation_timestamp) }}
              </span>
            </div>
          </div>
        </div>

        <!-- URL -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Endpoint
          </h3>
          <CopyPaste
            :has-copy="true"
            :copy-text="serving.served_model_url ?? ''"
            class="block"
          >
            <span
              class="text-sm text-muted-foreground hover:text-foreground break-all cursor-pointer transition-colors block"
            >
              {{ serving.served_model_url ?? '—' }}
            </span>
          </CopyPaste>
        </div>

        <!-- Edit action -->
        <div class="pt-2 border-t border-border">
          <Button
            variant="outline"
            class="w-full"
            @click="emit('edit', serving)"
          >
            <Icon name="lucide:pencil" class="w-4 h-4 mr-2" />
            Edit traffic
          </Button>
        </div>
      </div>
  </AppSheet>
</template>

<script setup lang="ts">
import AppSheet from '@/components/app/AppSheet.vue';
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

function formatDate(timestamp: string | undefined): string {
  if (!timestamp) return '—';
  return dayjs(timestamp).format('DD MMM YYYY, HH:mm:ss');
}
</script>
