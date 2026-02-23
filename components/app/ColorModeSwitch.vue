<template>
  <Button
    variant="outline"
    size="icon"
    class="cursor-pointer shrink-0 rounded-md"
    :title="isDark ? 'Light mode' : 'Dark mode'"
    @click="toggleTheme"
  >
    <Icon
      :name="isDark ? 'lucide:sun' : 'lucide:moon'"
      class="h-4 w-4"
    />
  </Button>
</template>

<script lang="ts" setup>
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

const toggleTheme = () => {
  const value = isDark.value ? 'light' : 'dark';
  colorMode.value = value;
  colorMode.preference = value;
};
</script>
