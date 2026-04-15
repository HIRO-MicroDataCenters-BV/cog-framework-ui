<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { SelectValue, type SelectValueProps } from 'reka-ui';
import { cn } from '@/utils';

const props = defineProps<
  SelectValueProps & { class?: HTMLAttributes['class'] }
>();
</script>

<template>
  <SelectValue
    data-slot="select-value"
    v-bind="props"
    :class="cn('block min-w-0 max-w-full truncate', props.class)"
  >
    <slot />
  </SelectValue>
</template>
