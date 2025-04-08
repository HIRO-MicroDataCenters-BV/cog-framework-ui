import { z } from 'zod';

export const metricSchema = z.object({
  id: z.string().optional(),
  model_name: z.string(),
  accuracy_score: z.number(),
  example_count: z.number(),
  f1_score: z.number(),
  log_loss: z.number(),
  precision_score: z.number(),
  recall_score: z.number(),
  roc_auc: z.number(),
  score: z.number(),
  cpu_consumption: z.number(),
  memory_utilization: z.number(),
  registered_date_time: z.string().datetime().optional(),
});

export type MetricDto = z.input<typeof metricSchema>;
export type Metric = z.output<typeof metricSchema>;
