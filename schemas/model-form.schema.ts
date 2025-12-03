import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import type { ReviewItemsByType } from '~/types/form.types';

export const modelFormSchema = toTypedSchema(
  z
    .object({
      type: z.enum(['file', 'datastream']).optional(),
      metadata: z
        .object({
          name: z.string().min(1),
          description: z.string().min(1),
        })
        .optional(),
      file: z
        .object({
          model_id: z.string().optional(),
          file_type: z.number().optional(),
          files: z.any().optional(),
        })
        .optional(),
      datastream: z
        .object({
          model_id: z.string().optional(),
          file_type: z.number().optional(),
          uri: z.string().optional(),
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

      // Step 2: Metadata validation
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

      // Step 2: File type validation (for both types)
      if (data.type === 'file') {
        if (
          data.file?.file_type === undefined ||
          data.file?.file_type === null
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['file', 'file_type'],
          });
        }
      }

      if (data.type === 'datastream') {
        if (
          !data.datastream?.model_id ||
          data.datastream.model_id.trim() === ''
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['datastream', 'model_id'],
          });
        }

        if (
          data.datastream?.file_type === undefined ||
          data.datastream?.file_type === null
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['datastream', 'file_type'],
          });
        }
      }

      // Step 3: Source validation based on type
      if (data.type === 'file') {
        if (!data.file?.files) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['file', 'files'],
          });
        }
      }

      if (data.type === 'datastream') {
        if (!data.datastream?.uri || data.datastream.uri.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'validation.required',
            path: ['datastream', 'uri'],
          });
        }
      }
    }),
);

export const modelReviewItems: ReviewItemsByType = {
  file: [
    { label: 'type', valuePath: 'type' },
    { label: 'file_type', valuePath: 'file.file_type' },
    { label: 'description', valuePath: 'metadata.description' },
  ],
  datastream: [
    { label: 'type', valuePath: 'type' },
    { label: 'model_id', valuePath: 'datastream.model_id' },
    { label: 'file_type', valuePath: 'datastream.file_type' },
    { label: 'uri', valuePath: 'datastream.uri' },
    { label: 'description', valuePath: 'metadata.description' },
  ],
};
