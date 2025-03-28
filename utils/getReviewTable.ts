import { useI18n } from 'vue-i18n';

export interface ReviewItem {
  label: string;
  valuePath: string;
}

export interface ReviewItemsByType {
  [key: string]: ReviewItem[];
}

export interface ReviewTableItem {
  label: string;
  value: unknown;
}

export function getReviewTable<TData>(
  type: string,
  formValues: TData,
  reviewItems: ReviewItemsByType,
): ReviewTableItem[] {
  const { t } = useI18n();

  if (type) {
    let list: ReviewItem[] = [
      {
        label: 'type',
        valuePath: 'type',
      },
      {
        label: 'name',
        valuePath: 'metadata.name',
      },
      {
        label: 'description',
        valuePath: 'metadata.description',
      },
    ];
    if (reviewItems[type]) {
      list = [...list, ...reviewItems[type]];
    }
    return list.map((item) => {
      return {
        label: t(`label.${item.label}`),
        value: useGet(formValues as Record<string, unknown>, item.valuePath),
      };
    });
  }

  return [];
}
