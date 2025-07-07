import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

export const datasetFormSchema = toTypedSchema(
  z.object({
    type: z.enum(['file', 'table', 'data_stream']).optional(),
    metadata: z
      .object({
        name: z.string().optional(),
        description: z.string().optional(),
      })
      .optional(),
    source_settings: z
      .object({
        dataset_file: z.any().nullable().optional(),
        broker_name: z.string().optional(),
        broker_ip_address: z.string().optional(),
        broker_port: z.number().optional(),
        topic_name: z.string().optional(),
        topic_schema: z.string().optional(),
        db_url: z.string().optional(),
        table_name: z.string().optional(),
        selected_fields: z.string().optional(),
      })
      .optional(),
  }),
);

export const datasetFormInitialValues = {
  type: 'file',
  metadata: {
    name: '',
    description: '',
  },
  source_settings: {
    broker_name: '',
    broker_ip_address: '',
    broker_port: 0,
    topic_name: '',
    topic_schema: '',
  },
};

export const datasetReviewItems = {
  file: [
    {
      label: 'data_source',
      valuePath: 'source_settings.dataset_file.name',
    },
  ],
  table: [
    {
      label: 'db_url',
      valuePath: 'source_settings.db_url',
    },
    {
      label: 'table_name',
      valuePath: 'source_settings.table_name',
    },
    {
      label: 'fields',
      valuePath: 'source_settings.selected_fields',
    },
  ],
  data_stream: [
    {
      label: 'broker_name',
      valuePath: 'source_settings.broker_name',
    },
    {
      label: 'broker_ip_address',
      valuePath: 'source_settings.broker_ip_address',
    },
    {
      label: 'broker_port',
      valuePath: 'source_settings.broker_port',
    },
    {
      label: 'topic_name',
      valuePath: 'source_settings.topic_name',
    },
    {
      label: 'topic_schema',
      valuePath: 'source_settings.topic_schema',
    },
  ],
};
