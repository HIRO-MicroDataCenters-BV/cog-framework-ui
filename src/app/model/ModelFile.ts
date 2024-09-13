export const ModelFileTypeEnum = {
  MODEL_POLICY_FILE: '0',
  MODEL_FILE: '1',
} as const;

export type ModelFileType =
  (typeof ModelFileTypeEnum)[keyof typeof ModelFileTypeEnum];

export const ModelFileTypeWithLabels = {
  [ModelFileTypeEnum.MODEL_POLICY_FILE]: 'Model Policy File',
  [ModelFileTypeEnum.MODEL_FILE]: 'Model File',
} as const;
