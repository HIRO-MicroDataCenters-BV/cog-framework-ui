import { toast } from 'vue-sonner';
import type { ToastData, ToastError } from '~/types/toast.types';

export const useToast = () => {
  const { t } = useI18n();
  console.log('useToast');
  const success = (message: string, data?: ToastData) => {
    const translatedMessage = message.startsWith('toast.success.')
      ? t(message, data || {})
      : message;
    const id = data?.id ? `ID: ${data.id}` : '';

    toast.success(translatedMessage, {
      description: id,
      duration: 4000,
    });
  };

  const error = (
    error: string | ToastError | unknown,
    fallbackMessage?: string,
  ) => {
    let errorMessage = '';

    if (typeof error === 'string') {
      errorMessage = error.startsWith('toast.error.') ? t(error) : error;
    } else if ((error as ToastError)?.message) {
      errorMessage = (error as ToastError).message as string;
    } else if ((error as ToastError)?.detail) {
      errorMessage = (error as ToastError).detail as string;
    } else if (fallbackMessage) {
      errorMessage = fallbackMessage.startsWith('toast.error.')
        ? t(fallbackMessage)
        : fallbackMessage;
    } else {
      errorMessage = t('toast.error.unknown');
    }

    toast.error(errorMessage, {
      duration: 5000,
    });
  };

  const info = (message: string, data?: ToastData) => {
    const translatedMessage = message.startsWith('toast.info.')
      ? t(message, data || {})
      : message;

    toast.info(translatedMessage, {
      duration: 3000,
    });
  };

  const warning = (message: string, data?: ToastData) => {
    const translatedMessage = message.startsWith('toast.warning.')
      ? t(message, data || {})
      : message;

    toast.warning(translatedMessage, {
      duration: 4000,
    });
  };

  return {
    success,
    error,
    info,
    warning,
  };
};
