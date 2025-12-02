<script lang="ts" setup>
import { type HTMLAttributes, computed } from 'vue';
import { useFormField } from './useFormField';
import { cn } from '@/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const { formMessageId, error } = useFormField();
const { t, te } = useI18n();

// Translate error message if it's an i18n key (contains dots like 'validation.required')
const errorMessage = computed(() => {
  if (!error.value) return '';
  const errorStr = String(error.value);
  // Check if it looks like an i18n key and translation exists
  if (errorStr.includes('.') && te(errorStr)) {
    return t(errorStr);
  }
  return errorStr;
});
</script>

<template>
  <p
    v-if="error"
    :id="formMessageId"
    :class="cn('text-xs text-destructive', props.class)"
  >
    {{ errorMessage }}
  </p>
</template>
