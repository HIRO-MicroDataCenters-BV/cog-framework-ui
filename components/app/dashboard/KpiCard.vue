<script setup lang="ts">
defineProps<{
  label: string;
  value: number;
  icon: string;
  color: string;
  loading: boolean;
  error: boolean;
  errorTitle?: string;
}>();
</script>

<template>
  <div
    class="rounded-xl border border-border/60 bg-card p-2 flex flex-col gap-1"
  >
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium text-muted-foreground">{{ label }}</span>
      <Icon :name="icon" class="size-4" :class="color" />
    </div>
    <div class="text-xl font-bold tracking-tight">
      <Icon
        v-if="loading"
        name="lucide:loader-circle"
        class="size-6 animate-spin text-muted-foreground/50"
      />
      <span
        v-else-if="error"
        class="inline-flex items-center gap-1 text-base font-normal text-muted-foreground"
        :title="errorTitle ?? 'Failed to load'"
      >
        <Icon name="lucide:minus" class="size-4" />
      </span>
      <span v-else>{{ value }}</span>
    </div>
  </div>
</template>
