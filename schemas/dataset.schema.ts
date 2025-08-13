import { z } from 'zod';
import {
  requiredString,
  optionalString,
  requiredUrl,
  requiredIp,
  optionalIp,
  requiredPositiveInt,
  optionalPositiveInt,
  dateTimeField,
  enumField,
  createFormSchema,
  createResponseSchema,
  createUpdateSchema,
  CommonEnums,
} from '~/utils/validation';

// Enum for dataset types based on OpenAPI
export const datasetTypeEnum = enumField(CommonEnums.DATASET_TYPES);

// Enum for offset reset types
export const offsetResetEnum = enumField(CommonEnums.OFFSET_RESET);

// Dataset info details schema
export const datasetInfoDetailsSchema = z.object({
  id: requiredPositiveInt(),
  dataset_name: requiredString(),
  description: requiredString(),
  dataset_type: requiredString(),
  data_source_type: requiredString(),
});

// Dataset table schema
export const datasetTableSchema = createFormSchema({
  dataset_type: datasetTypeEnum,
  name: requiredString(),
  description: optionalString(),
  db_url: requiredUrl(),
  table_name: requiredString(),
  selected_fields: optionalString(),
});

// Dataset table register schema
export const datasetTableRegisterSchema = createResponseSchema({
  dataset_id: requiredPositiveInt(),
  db_url: requiredUrl(),
  table_name: requiredString(),
  fields_selected_list: requiredString(),
  register_date: dateTimeField(),
  dataset_name: requiredString(),
  description: requiredString(),
  dataset_type: requiredString(),
});

// Broker base schema
export const brokerBaseSchema = createFormSchema({
  name: requiredString(),
  ip: requiredIp(),
  port: requiredPositiveInt(),
});

// Broker response schema
export const brokerResponseSchema = createResponseSchema({
  broker_name: requiredString(),
  broker_ip: requiredIp(),
  broker_port: requiredPositiveInt(),
  creation_date: dateTimeField(),
});

// Broker update schema
export const brokerUpdateSchema = createUpdateSchema(brokerBaseSchema);

// Topic base schema
export const topicBaseSchema = createFormSchema({
  name: requiredString(),
  schema: optionalString(),
});

// Topic response schema
export const topicResponseSchema = createResponseSchema({
  topic_name: requiredString(),
  topic_schema: requiredString(),
  broker_id: requiredPositiveInt(),
  creation_date: dateTimeField(),
});

// Topic update schema
export const topicUpdateSchema = createUpdateSchema(topicBaseSchema);

// Dataset broker topic base schema
export const datasetBrokerTopicBaseSchema = createFormSchema({
  dataset_type: datasetTypeEnum,
  name: requiredString(),
  description: optionalString(),
  broker_id: requiredPositiveInt(),
  topic_id: requiredPositiveInt(),
});

// Dataset broker topic response schema
export const datasetBrokerTopicResponseSchema = z.object({
  dataset: datasetInfoDetailsSchema,
  broker_details: brokerResponseSchema,
  topic_details: topicResponseSchema,
});

// Dataset file register schema (for multipart form)
export const datasetFileRegisterSchema = createFormSchema({
  dataset_type: requiredString(),
  name: requiredString(),
  description: optionalString(),
});

// Dataset file update schema (for multipart form)
export const datasetFileUpdateSchema = z.object({
  id: requiredPositiveInt(),
  name: optionalString(),
  description: optionalString(),
  dataset_type: optionalString(),
});

// Dataset schema for general use
export const datasetSchema = createResponseSchema({
  dataset_name: requiredString(),
  description: requiredString(),
  data_source_type: requiredString(),
  train_and_inference_type: optionalString(),
});

// Export types
export type DatasetType = z.output<typeof datasetTypeEnum>;
export type OffsetReset = z.output<typeof offsetResetEnum>;
export type DatasetInfoDetails = z.output<typeof datasetInfoDetailsSchema>;
export type DatasetTable = z.output<typeof datasetTableSchema>;
export type DatasetTableRegister = z.output<typeof datasetTableRegisterSchema>;
export type BrokerBase = z.output<typeof brokerBaseSchema>;
export type BrokerResponse = z.output<typeof brokerResponseSchema>;
export type BrokerUpdate = z.output<typeof brokerUpdateSchema>;
export type TopicBase = z.output<typeof topicBaseSchema>;
export type TopicResponse = z.output<typeof topicResponseSchema>;
export type TopicUpdate = z.output<typeof topicUpdateSchema>;
export type DatasetBrokerTopicBase = z.output<
  typeof datasetBrokerTopicBaseSchema
>;
export type DatasetBrokerTopicResponse = z.output<
  typeof datasetBrokerTopicResponseSchema
>;
export type DatasetFileRegister = z.output<typeof datasetFileRegisterSchema>;
export type DatasetFileUpdate = z.output<typeof datasetFileUpdateSchema>;
export type Dataset = z.output<typeof datasetSchema>;

// Input types for forms
export type DatasetDto = z.input<typeof datasetSchema>;
export type DatasetTableDto = z.input<typeof datasetTableSchema>;
export type BrokerBaseDto = z.input<typeof brokerBaseSchema>;
export type BrokerUpdateDto = z.input<typeof brokerUpdateSchema>;
export type TopicBaseDto = z.input<typeof topicBaseSchema>;
export type TopicUpdateDto = z.input<typeof topicUpdateSchema>;
export type DatasetBrokerTopicBaseDto = z.input<
  typeof datasetBrokerTopicBaseSchema
>;
export type DatasetFileRegisterDto = z.input<typeof datasetFileRegisterSchema>;
export type DatasetFileUpdateDto = z.input<typeof datasetFileUpdateSchema>;
