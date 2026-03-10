<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { SelectValue, type SelectValueProps } from 'reka-ui';
import { cn } from '@/utils';

const props = defineProps<SelectValueProps & { class?: HTMLAttributes['class'] }>();
</script>

<template>
  <SelectValue
    data-slot="select-value"
    v-bind="props"
    :class="cn('max-w-[150px] overflow-hidden text-ellipsis', props.class)"
  >
    <slot />
  </SelectValue>
</template>
