<template>
  <Toaster position="top-right" expand rich-colors />
</template>

<script lang="ts" setup>
import { toast } from 'vue-sonner';
import { Toaster } from '@/components/ui/sonner';

const { t } = useI18n();

const showSuccess = (message: string, data?: Record<string, unknown>) => {
  const translatedMessage = message.startsWith('success.')
    ? t(message, data)
    : message;
  const id = data?.id ? `ID: ${data.id}` : '';

  toast.success(translatedMessage, {
    description: id,
    duration: 4000,
  });
};

const showError = (
  error: Error | string | Record<string, unknown>,
  fallbackMessage?: string,
) => {
  let errorMessage = '';

  if (typeof error === 'string') {
    errorMessage = error.startsWith('error.') ? t(error) : error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.detail) {
    errorMessage = error.detail;
  } else if (fallbackMessage) {
    errorMessage = fallbackMessage.startsWith('error.')
      ? t(fallbackMessage)
      : fallbackMessage;
  } else {
    errorMessage = t('error.unknown');
  }

  toast.error(errorMessage, {
    duration: 5000,
  });
};

const showInfo = (message: string, data?: Record<string, unknown>) => {
  const translatedMessage = message.startsWith('info.')
    ? t(message, data)
    : message;

  toast.info(translatedMessage, {
    duration: 3000,
  });
};

const showWarning = (message: string, data?: Record<string, unknown>) => {
  const translatedMessage = message.startsWith('warning.')
    ? t(message, data)
    : message;

  toast.warning(translatedMessage, {
    duration: 4000,
  });
};

// Экспортируем функции для использования в других компонентах
defineExpose({
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
});
</script>
