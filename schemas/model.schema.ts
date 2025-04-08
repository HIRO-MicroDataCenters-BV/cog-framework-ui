import { z } from 'zod';

export const modelSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  version: z.string(),
  last_modified_time: z.string().datetime().optional(),
  register_date: z.string().datetime().optional(),
});

export type ModelDto = z.input<typeof modelSchema>;
export type Model = z.output<typeof modelSchema>;
