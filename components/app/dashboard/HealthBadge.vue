<script setup lang="ts">
defineProps<{
  healthy: boolean | null;
  loading: boolean;
  error: boolean;
}>();
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
    :class="
      loading
        ? 'bg-muted text-muted-foreground'
        : error || healthy === false
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    "
  >
    <span
      v-if="!loading"
      class="size-1.5 rounded-full"
      :class="error || healthy === false ? 'bg-red-500' : 'bg-green-500'"
    />
    <Icon
      v-if="loading"
      name="lucide:loader-circle"
      class="size-3 animate-spin"
    />
    {{
      loading
        ? 'Checking…'
        : error || healthy === false
          ? 'Platform degraded'
          : 'Platform healthy'
    }}
  </span>
</template>
