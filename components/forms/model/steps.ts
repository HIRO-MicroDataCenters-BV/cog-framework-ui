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
                  value: 'datastream',
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
        { fields: [{ type: 'text', name: 'datastream.model_id', label: t('label.model_id'), placeholder: t('placeholder.model_id'), condition: { field: 'type', operator: 'eq', value: 'datastream', }, },], },

        { fields: [{ type: 'select', name: 'file.file_type', label: t('label.file_type'), placeholder: t('placeholder.file_type'), options: [{ value: 0, label: t('label.model_policy_file') }, { value: 1, label: t('label.model_file') },], condition: { field: 'type', operator: 'eq', value: 'file', }, }, { type: 'select', name: 'datastream.file_type', label: t('label.file_type'), placeholder: t('placeholder.file_type'), options: [{ value: 0, label: t('label.model_policy_file') }, { value: 1, label: t('label.model_file') },], condition: { field: 'type', operator: 'eq', value: 'datastream', }, },], },
      ],
    },
    { rows: [{ fields: [{ type: 'file', name: 'file.files', label: t('label.file'), placeholder: t('placeholder.browse'), accept: '.csv,.json', condition: { field: 'type', operator: 'eq', value: 'file', }, },], }, { fields: [{ type: 'text', name: 'datastream.uri', label: t('label.uri'), placeholder: t('placeholder.uri'), condition: { field: 'type', operator: 'eq', value: 'datastream', }, },], },], },
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
