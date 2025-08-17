interface TabItem {
  key: string;
  value: string;
  title: string;
  url: string;
  icon: string | null;
}

interface ListTabs {
  dataset_management: TabItem[];
  model_management: TabItem[];
}

export const uselistTabs = () => {
  const { t } = useI18n();
  return useState<ListTabs>('listTabs', () => {
    return {
      dataset_management: [],
      model_management: [],
    };
  });
};
