<template>
  <div class="h-full flex items-center justify-center">
    <div class="text-center max-w-md">
      <div
        class="p-4 rounded-full bg-orange-100 dark:bg-orange-900/30 w-fit mx-auto mb-4"
      >
        <Icon
          name="lucide:construction"
          class="w-12 h-12 text-orange-500 dark:text-orange-400"
        />
      </div>
      <h3 class="text-lg font-semibold mb-2">Coming Soon</h3>
      <p class="text-sm text-muted-foreground mb-4">
        We are working hard to bring you the model comparison feature. Stay
        tuned for updates!
      </p>
      <p class="text-xs text-muted-foreground">
        Compare metrics, parameters, and performance across different models.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ModelSummary } from '~/types/model.types';

const props = defineProps<{
  model: ModelSummary | null;
}>();
</script>
