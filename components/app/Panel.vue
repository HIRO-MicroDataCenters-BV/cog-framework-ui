<template>
  <div class="bg-background h-full flex flex-col">
    <div class="px-4 py-3 border-b flex items-center justify-between">
      <div class="flex items-center gap-2">
        <slot name="icon" />
        <h3 class="text-sm font-medium text-gray-500">
          {{ title }}
        </h3>
      </div>
      <div v-if="$slots.actions" class="flex items-center gap-1">
        <slot name="actions" />
      </div>
    </div>
    <div class="px-2 p-4 h-full overflow-y-auto">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
}

defineProps<Props>();
</script>
