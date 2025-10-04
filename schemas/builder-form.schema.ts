import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

export const pipelineNameSchema = toTypedSchema(
  z.object({
    pipeline_name: z.string().min(3),
  }),
);

export const createComponentNameSchema = (
  existingNames: string[],
  currentName?: string,
) => {
  return toTypedSchema(
    z.object({
      component_name: z
        .string()
        .min(1, 'Component name is required')
        .regex(
          /^[a-zA-Z0-9_-]+$/,
          'Only letters, numbers, underscores, and hyphens are allowed',
        )
        .refine((name) => {
          // Don't check uniqueness against the current name being edited
          if (currentName && name === currentName) {
            return true;
          }
          return !existingNames.includes(name);
        }, 'Component name must be unique'),
    }),
  );
};
