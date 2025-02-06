<template>
  <div>
    <Switch :checked="isDark" @update:checked="toggleTheme">
      <template #thumb>
        <Icon v-if="isDark" name="lucide:moon" />
        <Icon v-else name="lucide:sun" />
      </template>
    </Switch>
  </div>
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

<style></style>
