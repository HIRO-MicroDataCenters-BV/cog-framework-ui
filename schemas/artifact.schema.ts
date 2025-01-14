import { z } from "zod";

export const artifactSchema = z.object({
  id: z.number().optional(),
  model_id: z.number().optional(),
  dataset_id: z.number().optional(),
  model_name: z.string(),
  validation_artifact: z.object({}),
});

export type ArtifactDto = z.input<typeof artifactSchema>;
export type Artifact = z.output<typeof artifactSchema>;
