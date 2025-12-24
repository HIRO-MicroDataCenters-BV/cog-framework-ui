import { ref } from 'vue';

export const getModelFormSteps = (t: (key: string) => string) =>
  ref([
    {
      rows: [
        {
          fields: [
            {
              type: 'text',
              name: 'metadata.name',
              label: t('label.name'),
              placeholder: t('placeholder.model_name'),
              required: true,
            },
          ],
        },
        {
          fields: [
            {
              type: 'select',
              name: 'metadata.model_type',
              label: t('label.model_type'),
              placeholder: t('placeholder.model_type'),
              options: [
                { value: 'classification', label: t('label.classification') },
                { value: 'regression', label: t('label.regression') },
                { value: 'clustering', label: t('label.clustering') },
                { value: 'general', label: t('label.general') },
              ],
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
              required: true,
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
              type: 'select',
              name: 'file.file_type',
              label: t('label.file_type'),
              placeholder: t('placeholder.file_type'),
              options: [
                { value: 0, label: t('label.model_policy_file') },
                { value: 1, label: t('label.model_file') },
              ],
              required: true,
            },
          ],
        },
        {
          fields: [
            {
              type: 'file',
              name: 'file.files',
              label: t('label.file'),
              placeholder: t('placeholder.browse'),
              accept: '.csv,.json',
              required: true,
            },
          ],
        },
      ],
    },
  ]);

export const modelFormNavigation = [
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
