export const uselistTabs = () => {
  const { t } = useI18n();
  return useState('listTabs', () => {
    return {
      dataset_management: [],
      model_management: [],
    };
  });
};
