<script setup lang="ts">
import OverviewPanel from './OverviewPanel.vue';
import type { OverviewRecommendation } from '~/types/overview.types';

defineProps<{
  recommendations: OverviewRecommendation[];
  loading: boolean;
}>();
</script>

<template>
  <OverviewPanel
    title="Recommendations"
    icon="lucide:lightbulb"
    icon-color="text-teal-500"
  >
    <div class="flex flex-col gap-3 p-4 flex-1">
      <span
        v-if="loading"
        class="inline-block h-10 w-full rounded bg-muted animate-pulse"
      />
      <div
        v-for="rec in loading ? [] : recommendations"
        :key="rec.message"
        class="rounded-lg border px-3 py-2 text-sm"
        :class="
          rec.kind === 'warning'
            ? 'border-amber-500/40 bg-amber-500/10'
            : 'border-border/60 bg-muted/30'
        "
      >
        {{ rec.message }}
        <NuxtLink
          :to="rec.link"
          class="ml-1 font-medium underline underline-offset-2"
        >
          {{ rec.action }} →
        </NuxtLink>
      </div>
    </div>
  </OverviewPanel>
</template>
