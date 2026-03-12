<script setup lang="ts">
const { setPage } = useApp();

setPage({
  section: 'flowise',
});

const flowiseUrl = '/chat/?chatflowid=1';
</script>

<template>
  <div class="h-[calc(100svh-74px)] w-full">
    <iframe
      :src="flowiseUrl"
      title="Flowise"
      class="w-full h-full border-0"
      referrerpolicy="no-referrer"
    />
  </div>
</template>

