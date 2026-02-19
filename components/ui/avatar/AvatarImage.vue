<script setup lang="ts">
import type { AvatarImageProps } from 'reka-ui';
import { AvatarImage as RekaAvatarImage } from 'reka-ui';

const props = defineProps<AvatarImageProps>();

defineEmits<{
  loadingStatusChange: [status: 'idle' | 'loading' | 'loaded' | 'error'];
}>();
</script>

<template>
  <RekaAvatarImage
    data-slot="avatar-image"
    v-bind="props"
    class="aspect-square size-full"
    @loading-status-change="$emit('loadingStatusChange', $event)"
  >
    <slot />
  </RekaAvatarImage>
</template>
