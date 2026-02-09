<template>
  <div
    v-if="isLoading"
    class="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800"
  >
    <div class="h-full bg-blue-600 loading-bar"></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isLoading?: boolean;
  }>(),
  {
    isLoading: false,
  },
);
</script>

<style scoped>
.loading-bar {
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% {
    width: 0;
    margin-left: 0;
  }
  50% {
    width: 50%;
    margin-left: 25%;
  }
  100% {
    width: 0;
    margin-left: 100%;
  }
}
</style>
