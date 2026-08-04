<script setup lang="ts">
import type { RunBucket } from '~/composables/useDashboard';

const props = defineProps<{
  buckets: RunBucket[];
  loading: boolean;
  error: boolean;
}>();

const maxBucketTotal = computed(() =>
  Math.max(1, ...props.buckets.map((b) => b.total)),
);

function barWidth(count: number) {
  return `${(count / maxBucketTotal.value) * 100}%`;
}
</script>

<template>
  <div class="rounded-xl border border-border/60 bg-card flex flex-col">
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-border/50"
    >
      <div class="flex items-center gap-2">
        <Icon name="lucide:route" class="size-4 text-muted-foreground" />
        <span class="text-sm font-medium">Pipeline Runs (30d)</span>
      </div>
    </div>
    <div class="flex-1 px-4 py-3 space-y-2">
      <template v-if="loading">
        <div v-for="i in 6" :key="i" class="flex items-center gap-2">
          <span class="w-5 text-[10px] text-muted-foreground">W{{ i }}</span>
          <div class="flex-1 h-5 rounded bg-muted animate-pulse" />
        </div>
      </template>
      <template v-else-if="error">
        <div
          class="flex flex-col items-center justify-center py-8 text-muted-foreground"
        >
          <Icon name="lucide:triangle-alert" class="size-5 text-red-500 mb-1" />
          <span class="text-xs">Failed to load pipeline runs</span>
        </div>
      </template>
      <template v-else>
        <div
          v-for="bucket in buckets"
          :key="bucket.label"
          class="flex items-center gap-2"
        >
          <span class="w-5 shrink-0 text-[10px] text-muted-foreground">{{
            bucket.label
          }}</span>
          <div class="flex-1 flex h-5 rounded overflow-hidden bg-muted/30">
            <div
              v-if="bucket.succeeded"
              class="bg-green-500 dark:bg-green-600 transition-all"
              :style="{ width: barWidth(bucket.succeeded) }"
              :title="`${bucket.succeeded} succeeded`"
            />
            <div
              v-if="bucket.running"
              class="bg-blue-400 dark:bg-blue-500 transition-all"
              :style="{ width: barWidth(bucket.running) }"
              :title="`${bucket.running} running`"
            />
            <div
              v-if="bucket.failed"
              class="bg-red-500 dark:bg-red-600 transition-all"
              :style="{ width: barWidth(bucket.failed) }"
              :title="`${bucket.failed} failed`"
            />
            <div
              v-if="bucket.skipped"
              class="bg-muted-foreground/30 transition-all"
              :style="{ width: barWidth(bucket.skipped) }"
              :title="`${bucket.skipped} skipped`"
            />
          </div>
          <span
            class="w-5 shrink-0 text-right text-[10px] text-muted-foreground"
          >
            {{ bucket.total }}
          </span>
        </div>
      </template>
    </div>
    <!-- Legend -->
    <div class="px-4 pb-3 flex items-center gap-3 flex-wrap">
      <span class="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span class="size-2 rounded-sm bg-green-500" /> Succeeded
      </span>
      <span class="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span class="size-2 rounded-sm bg-blue-400" /> Running
      </span>
      <span class="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span class="size-2 rounded-sm bg-red-500" /> Failed
      </span>
      <span class="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span class="size-2 rounded-sm bg-muted-foreground/30" /> Other
      </span>
    </div>
  </div>
</template>
