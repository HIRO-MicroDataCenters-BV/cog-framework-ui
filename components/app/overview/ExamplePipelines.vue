<script setup lang="ts">
import OverviewPanel from './OverviewPanel.vue';
import type { PipelineTemplateSummary } from '~/types/template.types';

defineProps<{
  examples: PipelineTemplateSummary[];
}>();
</script>

<template>
  <OverviewPanel
    title="Example pipelines"
    icon="lucide:sparkles"
    icon-color="text-indigo-500"
  >
    <div class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="example in examples"
        :key="example.key"
        :to="`/pipelines/builder/new?example=${example.key}`"
        class="rounded-lg border border-border/60 p-3 transition-colors hover:border-foreground/30 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex flex-col gap-1"
      >
        <span class="text-sm font-medium">{{ example.title }}</span>
        <span class="text-xs text-muted-foreground line-clamp-2">
          {{ example.summary }}
        </span>
        <span
          class="mt-auto pt-1 flex items-center justify-between text-[11px] text-muted-foreground"
        >
          <span>
            {{ example.steps.length }} steps · ~{{ example.estimated_minutes }}
            min
          </span>
          <span class="font-medium text-foreground">Open in builder →</span>
        </span>
      </NuxtLink>
    </div>
  </OverviewPanel>
</template>
