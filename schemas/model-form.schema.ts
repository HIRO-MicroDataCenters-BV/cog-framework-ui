import { z } from 'zod';
import type { ReviewItemsByType } from '~/types/form.types';

export const modelFormSchema = z.object({
  type: z.enum(['file', 'datastream']),
  version: z.number().optional(),
  model_id: z.string().optional(),
  file_type: z.number().optional(),
  metadata: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  file: z
    .object({
      files: z.array(z.any()).optional(),
    })
    .optional(),
  datastream: z
    .object({
      uri: z.string().url().optional(),
    })
    .optional(),
});

export const modelReviewItems: ReviewItemsByType = {
  file: [{ label: 'type', valuePath: 'type' }, { label: 'version', valuePath: 'version' }, { label:'model_id', valuePath:'model_id' }],
  datastream: [
    { label: 'type', valuePath: 'type' },
    { label:'model_id', valuePath:'model_id' },
    { label: 'version', valuePath: 'version' },
    { label:'uri', valuePath:'uri' },
  ],
};
