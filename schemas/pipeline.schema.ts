import { z } from 'zod';

const runDetailsSchema = z.object({
  uuid: z.string(),
  display_name: z.string(),
  name: z.string(),
  description: z.string(),
  experiment_uuid: z.string(),
  pipeline_uuid: z.string(),
  createdAt_in_sec: z.string().datetime(),
  scheduledAt_in_sec: z.string().datetime(),
  finishedAt_in_sec: z.string().datetime(),
  state: z.string(),
});

const experimentDetailsSchema = z.object({
  name: z.string(),
  description: z.string(),
  uuid: z.string(),
  createdatinSec: z.string().datetime(),
});

const pipelineDetailsSchema = z.object({
  uuid: z.string(),
  model_id: z.number(),
  name: z.string(),
  description: z.string(),
  parameters: z.string(),
  status: z.string(),
  createdAt_in_sec: z.string().datetime(),
  experiment_uuid: z.string(),
  pipeline_spec: z.string(),
  pipeline_spec_uri: z.string(),
});

const taskDetailsSchema = z.object({
  uuid: z.string(),
  runuuid: z.string(),
  createdtimestamp: z.string().datetime(),
  startedtimestamp: z.string().datetime(),
  finishedtimestamp: z.string().datetime(),
  state: z.string(),
  name: z.string(),
  parenttaskuuid: z.string(),
});

export const pipelineSchema = z.object({
  run_details: runDetailsSchema,
  experiment_details: experimentDetailsSchema,
  pipeline_details: pipelineDetailsSchema,
  task_details: z.array(taskDetailsSchema),
  model_ids: z.array(z.number()),
});

export type PipelineDto = z.input<typeof pipelineSchema>;
export type Pipeline = z.output<typeof pipelineSchema>;
