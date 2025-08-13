import { z } from 'zod';

// Resource duration schema
export const resourceDurationSchema = z.object({
  cpu: z.number().optional(),
  memory: z.number().optional(),
});

// Input schema
export const inputSchema = z.object({
  name: z.string(),
  value: z.string(),
});

// Artifact schema
export const artifactSchema = z.object({
  name: z.string(),
  path: z.string(),
  s3: z.record(z.string(), z.string()),
  optional: z.boolean(),
});

// Output schema
export const outputSchema = z.object({
  artifacts: z.array(artifactSchema).default([]),
  exitCode: z.number().optional(),
});

// Child schema (recursive) - simplified to avoid type conflicts
export const childSchema = z.lazy(() =>
  z.object({
    id: z.string(),
    podName: z.string(),
    name: z.string(),
    inputs: z.array(inputSchema).default([]),
    outputs: outputSchema.optional(),
    status: z.string(),
    startedAt: z.string().optional(),
    finishedAt: z.string().optional(),
    resourcesDuration: resourceDurationSchema.optional(),
    children: z.array(z.lazy(() => childSchema)).default([]),
    run_id: z.string(),
  }),
);

// Task structure schema
export const taskStructureSchema = z.object({
  id: z.string(),
  podName: z.string(),
  name: z.string(),
  inputs: z.array(inputSchema),
  outputs: z.array(z.string()).default([]),
  status: z.string(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  resourcesDuration: resourceDurationSchema.optional(),
  children: z.array(childSchema),
});

// Pipeline base schema
export const pipelineBaseSchema = z.object({
  uuid: z.string(),
  model_id: z.number().int().positive(),
  name: z.string(),
  description: z.string().optional(),
  parameters: z.string().optional(),
  status: z.string().optional(),
  createdAt_in_sec: z.number(),
  experiment_uuid: z.string().optional(),
  pipeline_spec: z.string().optional(),
  pipeline_spec_uri: z.string().optional(),
});

// Pipeline schema (with ID)
export const pipelineSchema = pipelineBaseSchema.extend({
  id: z.number().int().positive(),
});

// Pipeline response schema
export const pipelineResponseSchema = z.array(pipelineSchema);

// Pipeline run output schema
export const pipelineRunOutputSchema = z.object({
  run_name: z.string().optional(),
  run_id: z.string().optional(),
  status: z.string().optional(),
  duration: z.string().optional(),
  experiment_id: z.string().optional(),
  start_time: z.string().datetime().optional(),
});

// Pipeline runs schema
export const pipelineRunsSchema = z.object({
  pipeline_id: z.string(),
  versions: z.unknown().optional(),
  runs: z.array(pipelineRunOutputSchema),
});

// Run details base schema
export const runDetailsBaseSchema = z.object({
  uuid: z.string(),
  display_name: z.string(),
  name: z.string(),
  description: z.string(),
  experiment_uuid: z.string(),
  pipeline_uuid: z.string(),
  createdAt_in_sec: z.number(),
  scheduledAt_in_sec: z.number(),
  finishedAt_in_sec: z.number(),
  state: z.string(),
});

// Run details schema
export const runDetailsSchema = runDetailsBaseSchema;

// Run detail schema (different structure)
export const runDetailSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  state: z.string(),
  description: z.string(),
  created_at: z.string().datetime(),
  scheduled_at: z.string().datetime(),
  finished_at: z.string().datetime(),
});

// Experiment base schema
export const experimentBaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  uuid: z.string(),
  createdatinSec: z.number(),
});

// Experiment schema
export const experimentSchema = experimentBaseSchema.extend({
  run_details: z.array(runDetailSchema).default([]),
  pipelines: z.array(pipelineSchema).default([]),
});

// Task base schema
export const taskBaseSchema = z.object({
  uuid: z.string(),
  runuuid: z.string(),
  createdtimestamp: z.number(),
  startedtimestamp: z.number(),
  finishedtimestamp: z.number(),
  state: z.string(),
  name: z.string(),
  parenttaskuuid: z.string(),
});

// Task schema
export const taskSchema = taskBaseSchema;

// Pipeline component schema
export const pipelineComponentSchema = z.object({
  pipeline_workflow_name: z.string(),
  task_structure: z.record(z.string(), taskStructureSchema),
});

// Component create schema
export const componentCreateSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  input_path: z.array(z.string()).optional(),
  output_path: z.array(z.string()).optional(),
  component_file: z.string().optional(),
});

// Component response schema
export const componentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  input_path: z.array(z.string()),
  output_path: z.array(z.string()),
  component_file: z.string(),
});

// Pipeline component create schema
export const pipelineComponentCreateSchema = z.object({
  name: z.string().min(1, 'Pipeline component name is required'),
  pipeline_components: z.string().optional(),
  input_path: z.array(z.string()).optional(),
  output_path: z.array(z.string()).optional(),
});

// Pipeline component response schema
export const pipelineComponentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  pipeline_components: z.string(),
  input_path: z.array(z.string()),
  output_path: z.array(z.string()),
});

// KFP pipeline run details input schema
export const kfpPipelineRunDetailsInputSchema = z.object({
  run_details: runDetailsSchema.optional(),
  experiment_details: experimentSchema.optional(),
  pipeline_details: pipelineSchema.optional(),
  task_details: z.array(taskSchema).optional(),
  model_ids: z.array(z.number()).optional(),
});

// KFP pipeline run details schema
export const kfpPipelineRunDetailsSchema = z.object({
  run_details: runDetailsSchema.optional(),
  experiment_details: experimentSchema.optional(),
  pipeline_details: z.array(pipelineSchema).optional(),
  task_details: z.array(taskSchema).optional(),
});

// Export types
export type ResourceDuration = z.output<typeof resourceDurationSchema>;
export type Input = z.output<typeof inputSchema>;
export type Artifact = z.output<typeof artifactSchema>;
export type Output = z.output<typeof outputSchema>;
export type TaskStructure = z.output<typeof taskStructureSchema>;
export type ChildType = z.output<typeof childSchema>;
export type PipelineBase = z.output<typeof pipelineBaseSchema>;
export type Pipeline = z.output<typeof pipelineSchema>;
export type PipelineResponse = z.output<typeof pipelineResponseSchema>;
export type PipelineRunOutput = z.output<typeof pipelineRunOutputSchema>;
export type PipelineRuns = z.output<typeof pipelineRunsSchema>;
export type RunDetailsBase = z.output<typeof runDetailsBaseSchema>;
export type RunDetails = z.output<typeof runDetailsSchema>;
export type RunDetail = z.output<typeof runDetailSchema>;
export type ExperimentBase = z.output<typeof experimentBaseSchema>;
export type Experiment = z.output<typeof experimentSchema>;
export type TaskBase = z.output<typeof taskBaseSchema>;
export type Task = z.output<typeof taskSchema>;
export type PipelineComponent = z.output<typeof pipelineComponentSchema>;
export type ComponentCreate = z.output<typeof componentCreateSchema>;
export type ComponentResponse = z.output<typeof componentResponseSchema>;
export type PipelineComponentCreate = z.output<
  typeof pipelineComponentCreateSchema
>;
export type PipelineComponentResponse = z.output<
  typeof pipelineComponentResponseSchema
>;
export type KfpPipelineRunDetailsInput = z.output<
  typeof kfpPipelineRunDetailsInputSchema
>;
export type KfpPipelineRunDetails = z.output<
  typeof kfpPipelineRunDetailsSchema
>;

// Input types for forms
export type PipelineBaseDto = z.input<typeof pipelineBaseSchema>;
export type ComponentCreateDto = z.input<typeof componentCreateSchema>;
export type PipelineComponentCreateDto = z.input<
  typeof pipelineComponentCreateSchema
>;
export type KfpPipelineRunDetailsInputDto = z.input<
  typeof kfpPipelineRunDetailsInputSchema
>;
