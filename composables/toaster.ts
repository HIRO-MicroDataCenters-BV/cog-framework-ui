import { toast } from 'vue-sonner';

export const useToaster = () => {
  const { t } = useI18n();

  return {
    show: (
      type: 'success' | 'error' | 'info' | 'warning',
      message: string,
      data?: Record<string, string | number>,
    ) => {
      console.log('show', type, message, data);
      const msg = t(`message.${type}.${message}`);
      const options = { duration: 3000, ...data };
      console.log('msg', msg);
      console.log('options', options);
      switch (type) {
        case 'success':
          toast.success(msg, options);
          break;
        case 'error':
          toast.error(msg, options);
          break;
        case 'warning':
          toast.warning(msg, options);
          break;
        case 'info':
          toast.info(msg, options);
          break;
      }
      console.log('toast', toast);
    },
  };
};
