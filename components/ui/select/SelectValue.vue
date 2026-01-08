<script setup lang="ts">
import { SelectValue, type SelectValueProps } from 'reka-ui';

const props = defineProps<SelectValueProps>();
</script>

<template>
  <SelectValue data-slot="select-value" v-bind="props" class="max-w-[150px] overflow-hidden text-ellipsis">
    <slot />
  </SelectValue>
</template>
