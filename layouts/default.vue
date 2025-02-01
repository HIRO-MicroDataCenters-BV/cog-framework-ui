<template>
  <div class="w-full h-full flex flex-row bg-white">
    <AppSidebar />
    <div class="flex flex-col flex-auto h-full">
      <AppHeader />
      <div class="flex-1 overflow-hidden overflow-y-auto p-6">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AppHeader } from '#components';

</script>

<style></style>
