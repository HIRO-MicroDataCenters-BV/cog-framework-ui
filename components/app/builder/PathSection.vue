<template>
  <div class="mb-4">
    <h3 class="mb-2">{{ title }}</h3>
    <div>
      <div
        v-for="path in paths"
        :key="path.key"
        class="grid grid-cols-2 gap-4 text-sm mb-2"
      >
        <div class="flex items-center gap-2 text-gray-500">
          <Icon name="lucide:text" class="size-4" />
          {{ path.name }}
        </div>
        <div>{{ path.type }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PathSectionProps {
  title: string;
  paths: Array<{
    name: string;
    type: string;
    key: string;
  }>;
}

defineProps<PathSectionProps>();
</script>
