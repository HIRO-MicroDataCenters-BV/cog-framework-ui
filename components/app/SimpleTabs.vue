<script lang="ts" setup>
export interface Tab {
  key: string;
  label: string;
}

const props = defineProps<{
  tabs: Tab[];
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectTab = (key: string) => {
  emit('update:modelValue', key);
};
</script>

<template>
  <div class="w-full border-b border-gray-200 dark:border-gray-700">
    <nav class="w-full px-4 flex gap-6" aria-label="Tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
          modelValue === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
        ]"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </nav>
  </div>
</template>
