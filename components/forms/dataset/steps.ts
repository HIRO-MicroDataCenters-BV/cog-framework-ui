import { ref } from 'vue';

/**
 * Шаги формы для создания датасета
 * @param t - функция перевода i18n
 */
export const getDatasetFormSteps = (t: (key: string) => string) =>
  ref([
    {
      rows: [
        {
          fields: [
            {
              type: 'radio',
              name: 'type',
              options: [
                {
                  value: 'file',
                  label: t('label.file'),
                  subtitle: t('label_subtitle.file'),
                },
                {
                  value: 'table',
                  label: t('label.table'),
                  subtitle: t('label_subtitle.table'),
                },
                {
                  value: 'data_stream',
                  label: t('label.data_stream'),
                  subtitle: t('label_subtitle.data_stream'),
                },
              ],
            },
          ],
        },
      ],
    },
    {
      rows: [
        {
          fields: [
            {
              type: 'text',
              name: 'metadata.name',
              label: t('label.name'),
              placeholder: t('placeholder.dataset_name'),
            },
          ],
        },
        {
          fields: [
            {
              type: 'textarea',
              name: 'metadata.description',
              label: t('label.description'),
              placeholder: t('placeholder.dataset_description'),
            },
          ],
        },
      ],
    },
    {
      rows: [
        {
          fields: [
            {
              type: 'file',
              name: 'source_settings.dataset_file',
              label: t('label.dataset_file'),
              placeholder: t('placeholder.browse'),
              accept: '.csv,.json',
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'file',
              },
            },
          ],
        },
        {
          fields: [
            {
              type: 'text',
              name: 'source_settings.db_url',
              label: t('label.db_url'),
              placeholder: t('placeholder.db_url'),
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'table',
              },
            },
          ],
        },
        {
          fields: [
            {
              type: 'text',
              name: 'source_settings.table_name',
              label: t('label.table_name'),
              placeholder: t('placeholder.table_name'),
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'table',
              },
            },
          ],
        },
        {
          fields: [
            {
              type: 'text',
              name: 'source_settings.selected_fields',
              label: t('label.selected_fields'),
              placeholder: t('placeholder.selected_fields'),
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'table',
              },
            },
          ],
        },
        {
          fields: [
            {
              type: 'text',
              name: 'source_settings.broker_name',
              label: t('label.broker_name'),
              placeholder: t('placeholder.broker_name'),
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'data_stream',
              },
            },
          ],
        },
        {
          fields: [
            {
              type: 'text',
              name: 'source_settings.broker_ip_address',
              label: t('label.broker_ip_address'),
              placeholder: t('placeholder.broker_ip_address'),
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'data_stream',
              },
            },
            {
              type: 'number',
              name: 'source_settings.broker_port',
              label: t('label.broker_port'),
              placeholder: t('placeholder.broker_port'),
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'data_stream',
              },
            },
          ],
        },
        {
          fields: [
            {
              type: 'text',
              name: 'source_settings.topic_name',
              label: t('label.topic_name'),
              placeholder: t('placeholder.topic_name'),
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'data_stream',
              },
            },
          ],
        },
        {
          fields: [
            {
              type: 'textarea',
              name: 'source_settings.topic_schema',
              label: t('label.topic_schema'),
              placeholder: t('placeholder.topic_schema'),
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'data_stream',
              },
            },
          ],
        },
      ],
    },
  ]);

export const datasetFormNavigation = [
  'type',
  'metadata',
  'source_settings',
  'review',
];

export const getDatasetActionLabels = (t: (key: string) => string) => ({
  close: t('action.close'),
  back: t('action.back'),
  next: t('action.next'),
  submit: t('action.submit'),
});
