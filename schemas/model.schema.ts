import { z } from 'zod';
import {
  requiredString,
  optionalString,
  requiredUrl,
  requiredPositiveInt,
  optionalPositiveInt,
  dateTimeField,
  enumField,
  createFormSchema,
  createResponseSchema,
  createUpdateSchema,
  CommonEnums,
} from '~/utils/validation';

// Enum for model file types based on OpenAPI
export const modelFileTypeEnum = enumField(CommonEnums.MODEL_FILE_TYPES);

// Model file upload schema
export const modelFileUploadSchema = createResponseSchema({
  file_type: modelFileTypeEnum,
  model_id: requiredPositiveInt(),
  register_date: dateTimeField(),
  file_name: requiredString(),
  file_path: requiredString(),
  file_description: optionalString(),
});

// Model file upload details schema
export const modelFileUploadDetailsSchema = z.object({
  file_id: requiredPositiveInt(),
  file_name: requiredString(),
});

// Model info base schema (for creation)
export const modelInfoBaseSchema = createFormSchema({
  name: requiredString(),
  version: requiredString(),
  type: requiredString(),
  description: requiredString(),
});

// Model info schema (response)
export const modelInfoSchema = createResponseSchema({
  name: requiredString(),
  version: requiredString(),
  type: requiredString(),
  description: requiredString(),
  last_modified_time: dateTimeField(),
  register_date: dateTimeField(),
});

// Model info update schema
export const modelInfoUpdateSchema = createUpdateSchema(modelInfoBaseSchema);

// Model detailed response schema
export const modelDetailedResponseSchema = z.object({
  model_id: requiredPositiveInt(),
  model_name: requiredString(),
  model_description: requiredString(),
  author: requiredString(),
  register_date: dateTimeField(),
  datasets: z.array(z.unknown()).default([]),
  model_files: z.array(modelFileUploadSchema).default([]),
});

// Model deploy schema
export const modelDeploySchema = createFormSchema({
  name: requiredString(),
  version: requiredString(),
  isvc_name: requiredString(),
});

// Model URI upload schema
export const modelUploadUriSchema = createFormSchema({
  file_type: modelFileTypeEnum,
  model_id: requiredPositiveInt(),
  description: optionalString(),
  uri: requiredUrl(),
});

// Save model details schema
export const saveModelDetailsSchema = createFormSchema({
  name: requiredString(),
  file_type: modelFileTypeEnum,
  description: optionalString(),
});

// Upload model file schema
export const uploadModelFileSchema = createFormSchema({
  file_type: modelFileTypeEnum,
  file_description: optionalString(),
});

// Update model file version schema
export const updateModelFileVersionSchema = createFormSchema({
  model_id: requiredPositiveInt(),
  file_id: requiredPositiveInt(),
  file_description: optionalString(),
});

// Export types
export type ModelFileType = z.output<typeof modelFileTypeEnum>;
export type ModelFileUpload = z.output<typeof modelFileUploadSchema>;
export type ModelFileUploadDetails = z.output<
  typeof modelFileUploadDetailsSchema
>;
export type ModelInfoBase = z.output<typeof modelInfoBaseSchema>;
export type ModelInfo = z.output<typeof modelInfoSchema>;
export type ModelInfoUpdate = z.output<typeof modelInfoUpdateSchema>;
export type ModelDetailedResponse = z.output<
  typeof modelDetailedResponseSchema
>;
export type ModelDeploy = z.output<typeof modelDeploySchema>;
export type ModelUploadUri = z.output<typeof modelUploadUriSchema>;
export type SaveModelDetails = z.output<typeof saveModelDetailsSchema>;
export type UploadModelFile = z.output<typeof uploadModelFileSchema>;
export type UpdateModelFileVersion = z.output<
  typeof updateModelFileVersionSchema
>;

// Input types for forms
export type ModelInfoDto = z.input<typeof modelInfoBaseSchema>;
export type ModelInfoUpdateDto = z.input<typeof modelInfoUpdateSchema>;
export type ModelDeployDto = z.input<typeof modelDeploySchema>;
export type ModelUploadUriDto = z.input<typeof modelUploadUriSchema>;
export type SaveModelDetailsDto = z.input<typeof saveModelDetailsSchema>;
export type UploadModelFileDto = z.input<typeof uploadModelFileSchema>;
export type UpdateModelFileVersionDto = z.input<
  typeof updateModelFileVersionSchema
>;
