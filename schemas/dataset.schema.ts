import { z } from "zod";

export const datasetSchema = z.object({
  id: z.string().optional(),
  dataset_name: z.string(),
  description: z.string(),
  dataset_type: z.number(),
  files: z.array(z.string()),
  last_modified_time: z.string().datetime().optional(),
  register_date: z.string().datetime().optional(),
});

export type DatasetDto = z.input<typeof datasetSchema>;
export type Dataset = z.output<typeof datasetSchema>;
