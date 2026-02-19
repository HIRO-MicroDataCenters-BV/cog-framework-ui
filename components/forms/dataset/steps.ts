export const getDatasetFormSteps = (
  t: (key: string) => string,
  brokerOptions: Ref<{ label: string; value: string | number }[]>,
  topicOptions: Ref<{ label: string; value: string | number }[]>,
) =>
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
              required: true,
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
              required: true,
            },
          ],
        },
        {
          fields: [
            {
              type: 'select',
              name: 'dataset_type',
              label: t('label.dataset_type'),
              placeholder: t('placeholder.dataset_type'),
              required: true,
              options: [
                {
                  value: 0,
                  label: t('label.train'),
                },
                {
                  value: 1,
                  label: t('label.inference'),
                },
                {
                  value: 2,
                  label: t('label.train_and_inference'),
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
              type: 'file',
              name: 'source_settings.dataset_file',
              label: t('label.dataset_file'),
              placeholder: t('placeholder.browse'),
              accept: '.csv,.json,.xlsx,.xls',
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'file',
              },
              required: true,
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
              hint: 'db_url_hint', // Will be resolved dynamically in StepForm
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'table',
              },
              required: true,
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
              required: true,
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
              required: true,
            },
          ],
        },
        {
          fields: [
            {
              type: 'action_button',
              name: 'source_settings.test_connection',
              label: t('label.test_connection'),
              buttonLabel: t('action.test_connection'),
              actionName: 'test_connection',
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'table',
              },
            },
          ],
        },
        // Broker Selection Mode
        {
          fields: [
            {
              type: 'radio',
              name: 'source_settings.broker_selection',
              label: 'Broker Selection',
              options: [
                { value: 'existing', label: 'Existing Broker' },
                { value: 'new', label: 'New Broker' },
              ],
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'data_stream',
              },
            },
          ],
        },
        // Existing Broker Dropdown
        {
          fields: [
            {
              type: 'select',
              name: 'source_settings.broker_id',
              label: 'Select Broker',
              placeholder: t('placeholder.select_broker'),
              options: brokerOptions,
              condition: {
                group: 'and',
                conditions: [
                  { field: 'type', operator: 'eq', value: 'data_stream' },
                  {
                    field: 'source_settings.broker_selection',
                    operator: 'eq',
                    value: 'existing',
                  },
                ],
              },
            },
          ],
        },
        // New Broker Fields
        {
          fields: [
            {
              type: 'text',
              name: 'source_settings.broker_name',
              label: t('label.broker_name'),
              placeholder: t('placeholder.broker_name'),
              condition: {
                group: 'and',
                conditions: [
                  { field: 'type', operator: 'eq', value: 'data_stream' },
                  {
                    field: 'source_settings.broker_selection',
                    operator: 'eq',
                    value: 'new',
                  },
                ],
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
                group: 'and',
                conditions: [
                  { field: 'type', operator: 'eq', value: 'data_stream' },
                  {
                    field: 'source_settings.broker_selection',
                    operator: 'eq',
                    value: 'new',
                  },
                ],
              },
            },
            {
              type: 'number',
              name: 'source_settings.broker_port',
              label: t('label.broker_port'),
              placeholder: t('placeholder.broker_port'),
              condition: {
                group: 'and',
                conditions: [
                  { field: 'type', operator: 'eq', value: 'data_stream' },
                  {
                    field: 'source_settings.broker_selection',
                    operator: 'eq',
                    value: 'new',
                  },
                ],
              },
            },
          ],
        },
        // Topic Selection Mode
        {
          fields: [
            {
              type: 'radio',
              name: 'source_settings.topic_selection',
              label: 'Topic Selection',
              options: [
                { value: 'existing', label: 'Existing Topic' },
                { value: 'new', label: 'New Topic' },
              ],
              condition: {
                field: 'type',
                operator: 'eq',
                value: 'data_stream',
              },
            },
          ],
        },
        // Existing Topic Dropdown
        {
          fields: [
            {
              type: 'select',
              name: 'source_settings.topic_id',
              label: 'Select Topic',
              placeholder: t('placeholder.select_topic'),
              options: topicOptions,
              condition: {
                group: 'and',
                conditions: [
                  { field: 'type', operator: 'eq', value: 'data_stream' },
                  {
                    field: 'source_settings.topic_selection',
                    operator: 'eq',
                    value: 'existing',
                  },
                ],
              },
            },
          ],
        },
        // New Topic Fields
        {
          fields: [
            {
              type: 'text',
              name: 'source_settings.topic_name',
              label: t('label.topic_name'),
              placeholder: t('placeholder.topic_name'),
              condition: {
                group: 'and',
                conditions: [
                  { field: 'type', operator: 'eq', value: 'data_stream' },
                  {
                    field: 'source_settings.topic_selection',
                    operator: 'eq',
                    value: 'new',
                  },
                ],
              },
            },
          ],
        },
        {
          fields: [
            {
              type: 'select',
              name: 'data_source_type',
              label: t('label.data_source_type'),
              placeholder: t('placeholder.data_source_type'),
              options: [
                {
                  value: 10,
                  label: 'Kafka',
                },
                {
                  value: 11,
                  label: 'NATS',
                },
              ],
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
                group: 'and',
                conditions: [
                  { field: 'type', operator: 'eq', value: 'data_stream' },
                  {
                    field: 'source_settings.topic_selection',
                    operator: 'eq',
                    value: 'new',
                  },
                ],
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
