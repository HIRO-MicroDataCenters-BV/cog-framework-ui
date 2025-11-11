<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <th
    data-slot="table-head"
    :class="
      cn(
        'text-muted-foreground h-10 min-w-[85px] pr-2 pl-6 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] border-b border-border bg-sidebar',
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>
