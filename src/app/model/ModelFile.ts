export const ModelFileTypeEnum = {
  MODEL_POLICY_FILE: '0',
  MODEL_FILE: '1',
} as const;

export type ModelFileType =
  (typeof ModelFileTypeEnum)[keyof typeof ModelFileTypeEnum];
