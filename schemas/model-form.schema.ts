import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import type { ReviewItemsByType } from '~/types/form.types';

export const modelFormSchema = toTypedSchema(
  z.object({
    metadata: z.object({
      name: z.string().min(1, 'validation.required'),
      model_type: z.string().optional(),
      description: z.string().min(1, 'validation.required'),
    }),
    file: z
      .object({
        file_type: z.number().optional(),
        files: z.any().optional(),
      })
      .optional(),
  }),
);

export const modelReviewItems: ReviewItemsByType = {
  file: [
    { label: 'name', valuePath: 'metadata.name' },
    { label: 'model_type', valuePath: 'metadata.model_type' },
    { label: 'file_type', valuePath: 'file.file_type' },
    { label: 'description', valuePath: 'metadata.description' },
  ],
};
