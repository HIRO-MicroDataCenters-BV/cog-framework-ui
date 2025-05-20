import { z } from 'zod';
import type { ReviewItemsByType } from '~/types/form.types';

export const modelFormSchema = z.object({
  file: z.object({
    model_id: z.string().min(1, 'Required'),
    file_type: z.number().min(0).max(1),
    file_description: z.string().min(1, 'Required'),
    files: z.array(z.any()).min(1, 'At least one file is required'),
  }),
  datastream: z.object({
    model_id: z.string().min(1, 'Required'),
    file_type: z.number().min(0).max(1),
    description: z.string().min(1, 'Required'),
    uri: z.string().url('Must be a valid URL'),
  }),
});

export const modelReviewItems: ReviewItemsByType = {
  file: [
    { label: 'Model ID', valuePath: 'file.model_id' },
    { label: 'File Type', valuePath: 'file.file_type' },
    { label: 'Description', valuePath: 'file.file_description' },
    { label: 'Files', valuePath: 'file.files' },
  ],
  datastream: [
    { label: 'Model ID', valuePath: 'datastream.model_id' },
    { label: 'File Type', valuePath: 'datastream.file_type' },
    { label: 'Description', valuePath: 'datastream.description' },
    { label: 'URI', valuePath: 'datastream.uri' },
  ],
};
