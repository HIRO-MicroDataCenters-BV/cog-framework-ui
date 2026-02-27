<template>
  <div class="flex items-center gap-2 group">
    <button
      v-if="hasCopy && iconLeft"
      type="button"
      :class="
        cn(
          'cursor-pointer flex items-center justify-center size-6 rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )
      "
      @click="handleCopy"
    >
      <Icon
        :name="copied ? 'lucide:check' : 'lucide:copy'"
        :class="cn('size-4', copied && 'text-green-600')"
      />
    </button>
    <span ref="textRef" class="flex-1 min-w-0">
      <slot />
    </span>
    <button
      v-if="hasCopy && !iconLeft"
      type="button"
      :class="
        cn(
          'cursor-pointer flex items-center justify-center size-6 rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )
      "
      @click="handleCopy"
    >
      <Icon
        :name="copied ? 'lucide:check' : 'lucide:copy'"
        :class="cn('size-4', copied && 'text-green-600')"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import { useToaster } from '@/composables/toaster';
import { cn } from '@/utils';

const props = withDefaults(
  defineProps<{
    hasCopy?: boolean;
    copyText?: string;
    iconLeft?: boolean;
  }>(),
  {
    hasCopy: false,
    copyText: undefined,
    iconLeft: false,
  },
);

const { t } = useI18n();
const toaster = useToaster();
const { copy, isSupported } = useClipboard();
const copied = ref(false);
const textRef = ref<HTMLElement | null>(null);
let timeoutId: ReturnType<typeof setTimeout> | null = null;

const handleCopy = async () => {
  if (!isSupported.value) {
    toaster.show('error', 'clipboard_not_supported');
    return;
  }

  const textToCopy = props.copyText || textRef.value?.textContent?.trim() || '';
  if (!textToCopy) {
    toaster.show('error', 'nothing_to_copy');
    return;
  }

  try {
    await copy(textToCopy);
    copied.value = true;
    toaster.show('success', 'copied_to_clipboard');

    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
    toaster.show('error', 'failed_to_copy');
  }
};

onBeforeUnmount(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});
</script>
