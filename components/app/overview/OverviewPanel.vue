<script setup lang="ts">
/** Card shell shared by the Overview panels (same look as the dashboard's). */
defineProps<{
  title: string;
  icon: string;
  iconColor: string;
}>();
</script>

<template>
  <div
    class="rounded-xl border border-border/60 bg-card flex flex-col overflow-hidden"
  >
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-border/50"
    >
      <div class="flex items-center gap-2">
        <Icon :name="icon" class="size-4" :class="iconColor" />
        <span class="text-sm font-medium">{{ title }}</span>
      </div>
    </div>
    <div class="flex-1 flex flex-col">
      <slot />
    </div>
  </div>
</template>
