import { ref } from 'vue';

export const getModelFormSteps = (t: (key: string) => string) =>
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
              placeholder: t('placeholder.model_name'),
            },
          ],
        },
        {
          fields: [
            {
              type: 'textarea',
              name: 'metadata.description',
              label: t('label.description'),
              placeholder: t('placeholder.description'),
            },
          ],
        },
        {
          fields: [
            {
              type: 'text',
              name: 'model_id',
              label: t('label.model_id'),
              placeholder: t('placeholder.model_id'),
            },
          ],
        },
        {
          fields: [
            {
              type: 'number',
              name: 'version',
              label: t('label.version'),
              placeholder: t('placeholder.version'),
            },
          ],
        },
        {
          fields: [
            {
              type: 'select',
              name: 'file_type',
              label: t('label.file_type'),
              placeholder: t('placeholder.file_type'),
              options: [
                { value: '0', label: t('label.model_policy_file') },
                { value: '1', label: t('label.model_file') },
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
              type: 'file',
              name: 'source_settings.dataset_file',
              label: t('label.file'),
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
              name: 'source_settings.uri',
              label: t('label.uri'),
              placeholder: t('placeholder.uri'),
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

export const modelFormNavigation = [
  'type',
  'metadata',
  'source_settings',
  'review',
];

export const getModelActionLabels = (t: (key: string) => string) => ({
  close: t('action.close'),
  back: t('action.back'),
  next: t('action.next'),
  submit: t('action.submit'),
});
