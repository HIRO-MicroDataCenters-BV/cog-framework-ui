import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

// IP address validation regex
const ipAddressRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Port validation: 1-65535
const portRegex =
  /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

// Database URL validation pattern (supports any protocol scheme)
// Examples: postgresql://, mysql://, mongodb://, redis://, mssql://, oracle://, jdbc:, etc.
const dbUrlPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/?\/?[^\s]+$/i;

export const datasetFormSchema = toTypedSchema(
  z
    .object({
      type: z.enum(['file', 'table', 'data_stream']).optional(),
      metadata: z
        .object({
          name: z.string().min(1),
          description: z.string().min(1),
        })
        .optional(),
      dataset_type: z
        .number()
        .int()
        .min(0)
        .max(2, 'validation.invalid_dataset_type')
        .optional(),
      source_settings: z
        .object({
          dataset_file: z.any().nullable().optional(),
          broker_name: z.string().optional(),
          broker_ip_address: z.string().optional(),
          broker_port: z
            .union([
              z.number().int().min(1).max(65535),
              z.string().regex(portRegex, 'validation.invalid_port'),
            ])
            .optional(),
          topic_name: z.string().optional(),
          topic_schema: z.string().optional(),
          db_url: z.string().optional(),
          table_name: z.string().optional(),
          selected_fields: z.string().optional(),
        })
        .optional(),
    })
    .superRefine((data, ctx) => {
      // Step 1: Type is required
      if (!data.type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'validation.required',
          path: ['type'],
        });
      }

      // Step 2: Metadata is required when type is selected
      if (data.type && (!data.metadata || !data.metadata.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'validation.required',
          path: ['metadata', 'name'],
        });
      }

      if (
        data.type &&
        (!data.metadata ||
          !data.metadata.description ||
          data.metadata.description.trim() === '')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'validation.required',
          path: ['metadata', 'description'],
        });
      }

      if (data.type && data.dataset_type === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'validation.required',
          path: ['dataset_type'],
        });
      }

      // Step 3: Source settings validation based on type
      if (data.type === 'file') {
        if (!data.source_settings || !data.source_settings.dataset_file) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['source_settings', 'dataset_file'],
          });
        }
      }

      if (data.type === 'table') {
        if (
          !data.source_settings ||
          !data.source_settings.db_url ||
          data.source_settings.db_url.trim() === ''
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['source_settings', 'db_url'],
          });
        } else if (!dbUrlPattern.test(data.source_settings.db_url)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.invalid_url',
            path: ['source_settings', 'db_url'],
          });
        }

        if (
          !data.source_settings ||
          !data.source_settings.table_name ||
          data.source_settings.table_name.trim() === ''
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['source_settings', 'table_name'],
          });
        }

        if (
          !data.source_settings ||
          !data.source_settings.selected_fields ||
          data.source_settings.selected_fields.trim() === ''
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['source_settings', 'selected_fields'],
          });
        }
      }

      if (data.type === 'data_stream') {
        // Broker name is required
        if (
          !data.source_settings ||
          !data.source_settings.broker_name ||
          data.source_settings.broker_name.trim() === ''
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['source_settings', 'broker_name'],
          });
        }

        // Broker IP address is required and must be valid IP
        if (
          !data.source_settings ||
          !data.source_settings.broker_ip_address ||
          data.source_settings.broker_ip_address.trim() === ''
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['source_settings', 'broker_ip_address'],
          });
        } else if (
          !ipAddressRegex.test(data.source_settings.broker_ip_address.trim())
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.invalid_ip_address',
            path: ['source_settings', 'broker_ip_address'],
          });
        }

        // Broker port is required and must be valid
        if (
          !data.source_settings ||
          data.source_settings.broker_port === undefined ||
          data.source_settings.broker_port === null ||
          data.source_settings.broker_port === 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['source_settings', 'broker_port'],
          });
        } else {
          let port: number;
          if (typeof data.source_settings.broker_port === 'string') {
            const parsed = parseInt(
              data.source_settings.broker_port.trim(),
              10,
            );
            if (isNaN(parsed)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'validation.invalid_port',
                path: ['source_settings', 'broker_port'],
              });
              return;
            }
            port = parsed;
          } else {
            port = data.source_settings.broker_port;
          }

          if (port < 1 || port > 65535) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'validation.invalid_port',
              path: ['source_settings', 'broker_port'],
            });
          }
        }

        // Topic name is required
        if (
          !data.source_settings ||
          !data.source_settings.topic_name ||
          data.source_settings.topic_name.trim() === ''
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['source_settings', 'topic_name'],
          });
        }
      }
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
