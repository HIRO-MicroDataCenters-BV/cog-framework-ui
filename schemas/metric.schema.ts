import { z } from 'zod';
import {
  requiredString,
  optionalString,
  requiredPositiveInt,
  optionalPositiveNumber,
  dateTimeField,
  createFormSchema,
  createResponseSchema,
  createUpdateSchema,
  arrayField,
  recordField,
  stringWithLength,
  usernameField,
  phoneField,
  requiredEmail,
  optionalEmail,
} from '~/utils/validation';

// Validation metric input schema
export const validationMetricInputSchema = createFormSchema({
  model_name: optionalString(),
  accuracy_score: optionalPositiveNumber(),
  example_count: z.number().int().optional(),
  f1_score: optionalPositiveNumber(),
  log_loss: optionalPositiveNumber(),
  precision_score: optionalPositiveNumber(),
  recall_score: optionalPositiveNumber(),
  roc_auc: optionalPositiveNumber(),
  score: optionalPositiveNumber(),
  cpu_consumption: optionalPositiveNumber(),
  memory_utilization: optionalPositiveNumber(),
});

// Validation metric schema (response)
export const validationMetricSchema = createResponseSchema({
  model_name: optionalString(),
  accuracy_score: optionalPositiveNumber(),
  example_count: z.number().int().optional(),
  f1_score: optionalPositiveNumber(),
  log_loss: optionalPositiveNumber(),
  precision_score: optionalPositiveNumber(),
  recall_score: optionalPositiveNumber(),
  roc_auc: optionalPositiveNumber(),
  score: optionalPositiveNumber(),
  cpu_consumption: optionalPositiveNumber(),
  memory_utilization: optionalPositiveNumber(),
  model_id: requiredPositiveInt(),
  dataset_id: requiredPositiveInt(),
  registered_date_time: dateTimeField(),
});

// Validation artifact input schema
export const validationArtifactInputSchema = createFormSchema({
  model_name: optionalString(),
  validation_artifacts: recordField(),
});

// Validation artifact schema (response)
export const validationArtifactSchema = createResponseSchema({
  model_name: optionalString(),
  validation_artifacts: recordField(),
  model_id: requiredPositiveInt(),
  dataset_id: requiredPositiveInt(),
});

// Inference logs schema
export const inferenceLogsSchema = z.object({
  logs: z.unknown().optional(),
});

// Pod log response schema
export const podLogResponseSchema = z.object({
  pod_name: requiredString(),
  namespace: requiredString(),
  container_name: requiredString(),
  pod_logs: arrayField(z.string()),
});

// Pod event response schema
export const podEventResponseSchema = z.object({
  pod_name: requiredString(),
  namespace: requiredString(),
  pod_events: arrayField(z.string()),
});

// Pod definition response schema
export const podDefinitionResponseSchema = z.object({
  pod_name: requiredString(),
  namespace: requiredString(),
  pod_definition: arrayField(z.string()),
});

// Deployments response schema
export const deploymentsResponseSchema = z.object({
  namespace: requiredString(),
  deployments: arrayField(z.string()),
});

// Users request schema
export const usersRequestSchema = createFormSchema({
  user_level: z.number().int().default(1),
  country: stringWithLength(1, 100, false),
  email: requiredEmail(),
  user_name: stringWithLength(1, 50),
  org_id: requiredPositiveInt(),
  full_name: stringWithLength(1, 100),
  phone: phoneField(false),
  job_title: optionalString(),
});

// Users update request schema
export const usersUpdateRequestSchema = z.object({
  user_level: z.number().int().default(1).optional(),
  country: stringWithLength(1, 100, false),
  email: optionalEmail(),
  user_name: stringWithLength(1, 50, false),
  org_id: z.number().int().positive().optional(),
  full_name: stringWithLength(1, 100, false),
  phone: phoneField(false),
  job_title: optionalString(),
  updated_at: dateTimeField(false).default(new Date().toISOString()),
});

// Users schema (response)
export const usersSchema = createResponseSchema({
  email: requiredEmail(),
  full_name: requiredString(),
  user_name: requiredString(),
  org_id: requiredPositiveInt(),
  country: requiredString(),
  phone: requiredString(),
  job_title: requiredString(),
  user_level: z.number().int(),
  password_updated_at: dateTimeField(),
});

// Export types
export type ValidationMetricInput = z.output<
  typeof validationMetricInputSchema
>;
export type ValidationMetric = z.output<typeof validationMetricSchema>;
export type ValidationArtifactInput = z.output<
  typeof validationArtifactInputSchema
>;
export type ValidationArtifact = z.output<typeof validationArtifactSchema>;
export type InferenceLogs = z.output<typeof inferenceLogsSchema>;
export type PodLogResponse = z.output<typeof podLogResponseSchema>;
export type PodEventResponse = z.output<typeof podEventResponseSchema>;
export type PodDefinitionResponse = z.output<
  typeof podDefinitionResponseSchema
>;
export type DeploymentsResponse = z.output<typeof deploymentsResponseSchema>;
export type UsersRequest = z.output<typeof usersRequestSchema>;
export type UsersUpdateRequest = z.output<typeof usersUpdateRequestSchema>;
export type UsersSchema = z.output<typeof usersSchema>;

// Input types for forms
export type ValidationMetricInputDto = z.input<
  typeof validationMetricInputSchema
>;
export type ValidationArtifactInputDto = z.input<
  typeof validationArtifactInputSchema
>;
export type UsersRequestDto = z.input<typeof usersRequestSchema>;
export type UsersUpdateRequestDto = z.input<typeof usersUpdateRequestSchema>;
