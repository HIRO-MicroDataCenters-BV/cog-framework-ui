<template>
  <div class="h-[calc(100svh-64px)]">
    <AppBuilder />
  </div>
</template>

<script lang="ts" setup>
const { setPage, page } = useApp();

setPage({
  section: 'pipelines_builder',
  data: {
    builder: {
      name: '',
      nodes: [],
      edges: [],
    },
  },
});
</script>

<style></style>
