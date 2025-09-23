<script setup lang="ts">
import { CollapsibleContent, type CollapsibleContentProps } from 'reka-ui';

const props = defineProps<CollapsibleContentProps>();
</script>

<template>
  <CollapsibleContent
    data-slot="collapsible-content"
    class="collapsible-animate overflow-hidden"
    v-bind="props"
  >
    <slot />
  </CollapsibleContent>
</template>

<style scoped>
/* Use keyframes with --reka-collapsible-content-height (measured by Reka) */
@keyframes collapse-down {
  from {
    height: 0;
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    height: var(--reka-collapsible-content-height);
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes collapse-up {
  from {
    height: var(--reka-collapsible-content-height);
    opacity: 1;
    transform: translateY(0);
  }
  to {
    height: 0;
    opacity: 0;
    transform: translateY(-2px);
  }
}

.collapsible-animate {
  overflow: hidden;
}

/* Apply animations using deep selectors for scoped CSS */
::deep(.collapsible-animate[data-state='open']) {
  animation: collapse-down 0.22s ease-out forwards;
}

::deep(.collapsible-animate[data-state='closed']) {
  animation: collapse-up 0.22s ease-in forwards;
}
</style>
