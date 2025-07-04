import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import type { ReviewItemsByType } from '~/types/form.types';

export const modelFormSchema = toTypedSchema(
  z.object({
    type: z.enum(['file', 'datastream']).optional(),
    metadata: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
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
