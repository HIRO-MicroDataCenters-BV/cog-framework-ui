<template>
  <div class="mb-6">
    <h3
      class="mb-3 text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2"
    >
      <Icon name="lucide:arrow-left-from-line" class="w-3 h-3" />
      {{ title }}
    </h3>
    <div class="space-y-2">
      <div
        v-for="path in paths"
        :key="path.key"
        class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-colors"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-5 h-5 rounded flex items-center justify-center text-background shadow-sm"
            :style="{ backgroundColor: getTypeColor(path.type) }"
          >
            <Icon :name="getTypeIcon(path.type)" class="w-3 h-3" />
          </div>
          <span class="text-sm font-medium">{{ path.name }}</span>
        </div>
        <span
          class="text-[10px] font-mono px-1.5 py-0.5 rounded border opacity-70"
          :style="{
            borderColor: getTypeColor(path.type),
            color: getTypeColor(path.type),
          }"
        >
          {{ path.type }}
        </span>
      </div>
      <div
        v-if="paths.length === 0"
        class="text-sm text-gray-500 italic px-2 py-4 border-2 border-dashed rounded-lg text-center"
      >
        No outputs configured
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBuilderColors } from '~/composables/useBuilderColors';
import { useBuilderIcons } from '~/composables/useBuilderIcons';

const { getTypeColor } = useBuilderColors();
const { getTypeIcon } = useBuilderIcons();

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
