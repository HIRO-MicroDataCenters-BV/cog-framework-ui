import { toast } from 'vue-sonner';

export const useToaster = () => {
  const { t, te } = useI18n();

  return {
    show: (
      type: 'success' | 'error' | 'info' | 'warning',
      message: string,
      data?: Record<string, string | number>,
      opts?: { raw?: boolean },
    ) => {
      const key = `message.${type}.${message}`;
      // Callers pass either a message key or text straight from the API
      // ("Invalid kube-config file. ..."). Text with no translation is shown
      // as written instead of as "message.error.<text>".
      const translated = typeof te !== 'function' || te(key);
      const msg = opts?.raw || !translated ? message : t(key, data);
      const options = { duration: 3000, ...data };
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
    },
  };
};
