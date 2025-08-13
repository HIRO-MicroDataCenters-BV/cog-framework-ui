import { z } from 'zod';

/**
 * Utility functions for creating Zod schemas with i18n support
 * These functions create schemas that use i18n keys instead of hardcoded messages
 */

/**
 * Required string field with minimum length
 */
export const requiredString = (minLength: number = 1) =>
  z.string().min(minLength);

/**
 * Optional string field
 */
export const optionalString = () => z.string().optional();

/**
 * Required email field
 */
export const requiredEmail = () => z.string().email();

/**
 * Optional email field
 */
export const optionalEmail = () => z.string().email().optional();

/**
 * Required URL field
 */
export const requiredUrl = () => z.string().url();

/**
 * Optional URL field
 */
export const optionalUrl = () => z.string().url().optional();

/**
 * Required IP address field
 */
export const requiredIp = () => z.string().ip();

/**
 * Optional IP address field
 */
export const optionalIp = () => z.string().ip().optional();

/**
 * Required positive integer
 */
export const requiredPositiveInt = () => z.number().int().positive();

/**
 * Optional positive integer
 */
export const optionalPositiveInt = () => z.number().int().positive().optional();

/**
 * Required positive number
 */
export const requiredPositiveNumber = () => z.number().positive();

/**
 * Optional positive number
 */
export const optionalPositiveNumber = () => z.number().positive().optional();

/**
 * Username field with pattern validation
 */
export const usernameField = (required: boolean = true) => {
  const schema = z.string().regex(/^[a-zA-Z0-9_]+$/);
  return required ? schema.min(1) : schema.optional();
};

/**
 * Phone number field with pattern validation
 */
export const phoneField = (required: boolean = false) => {
  const schema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
  return required ? schema.min(1) : schema.optional();
};

/**
 * String field with length constraints
 */
export const stringWithLength = (
  minLength: number,
  maxLength: number,
  required: boolean = true,
) => {
  const schema = z.string().min(minLength).max(maxLength);
  return required ? schema : schema.optional();
};

/**
 * DateTime field
 */
export const dateTimeField = (required: boolean = true) => {
  const schema = z.string().datetime();
  return required ? schema : schema.optional();
};

/**
 * File upload field (accepts File objects)
 */
export const fileField = (required: boolean = true) => {
  const schema = z.instanceof(File);
  return required ? schema : schema.optional();
};

/**
 * Array of files field
 */
export const filesArrayField = (
  required: boolean = true,
  minFiles: number = 1,
) => {
  const schema = z.array(z.instanceof(File)).min(minFiles);
  return required ? schema : schema.optional();
};

/**
 * Enum field with custom values
 */
export const enumField = <T extends readonly [string, ...string[]]>(
  values: T,
  required: boolean = true,
) => {
  const schema = z.enum(values);
  return required ? schema : schema.optional();
};

/**
 * Record/object field with unknown values
 */
export const recordField = (required: boolean = false) => {
  const schema = z.record(z.string(), z.unknown());
  return required ? schema : schema.optional();
};

/**
 * Array field with specific item type
 */
export const arrayField = <T extends z.ZodTypeAny>(
  itemSchema: T,
  required: boolean = false,
) => {
  const schema = z.array(itemSchema);
  return required ? schema : schema.optional();
};

/**
 * Create a base entity schema with common fields
 */
export const createBaseEntitySchema = () =>
  z.object({
    id: requiredPositiveInt(),
    created_at: dateTimeField(),
    updated_at: dateTimeField(false),
  });

/**
 * Create a form schema without ID and timestamps
 */
export const createFormSchema = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape);

/**
 * Create a response schema with base entity fields
 */
export const createResponseSchema = <T extends z.ZodRawShape>(shape: T) =>
  createBaseEntitySchema().extend(shape);

/**
 * Create an update schema where all fields are optional
 */
export const createUpdateSchema = <T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
) => {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const partialShape: Record<string, z.ZodTypeAny> = {};

    for (const [key, value] of Object.entries(shape)) {
      if (key !== 'id' && key !== 'created_at') {
        partialShape[key] = (value as z.ZodTypeAny).optional();
      }
    }

    return z.object(partialShape);
  }

  return z.object({});
};

/**
 * Validation error mapper for i18n
 */
export const mapValidationError = (error: z.ZodError) => {
  return error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
};

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  USERNAME: /^[a-zA-Z0-9_]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  IP_ADDRESS:
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  PORT: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
} as const;

/**
 * Common enum values
 */
export const CommonEnums = {
  DATASET_TYPES: ['FILE', 'TABLE', 'STREAM'] as const,
  MODEL_FILE_TYPES: ['MODEL', 'POLICY', 'CONFIG', 'METADATA'] as const,
  OFFSET_RESET: ['earliest', 'latest'] as const,
  USER_LEVELS: [1, 2, 3, 4, 5] as const,
} as const;

/**
 * Create i18n-aware Zod schemas
 * These functions will use the zodI18n configuration for error messages
 */
export const createI18nSchema = {
  /**
   * Required model name field
   */
  modelName: () => requiredString(),

  /**
   * Required model version field
   */
  modelVersion: () => requiredString(),

  /**
   * Required model type field
   */
  modelType: () => requiredString(),

  /**
   * Required dataset name field
   */
  datasetName: () => requiredString(),

  /**
   * Required broker name field
   */
  brokerName: () => requiredString(),

  /**
   * Required topic name field
   */
  topicName: () => requiredString(),

  /**
   * Username with pattern validation
   */
  username: () => z.string().min(1).max(50).regex(ValidationPatterns.USERNAME),

  /**
   * Phone number with pattern validation
   */
  phone: () => z.string().regex(ValidationPatterns.PHONE).optional(),

  /**
   * Required IP address
   */
  ipAddress: () => requiredIp(),

  /**
   * Required port number
   */
  port: () => requiredPositiveInt(),
};
