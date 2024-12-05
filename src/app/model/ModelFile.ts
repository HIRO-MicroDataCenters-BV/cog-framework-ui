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

export type ModelFileData = {
  file_name: string;
  file_description: string;
  file_path: string;
  file_type: ModelFileType;
  id: number;
  register_date: string;
  user_id: number;
};

export type UploadedModelFile = {
  data?: ModelFileData;
  error?: {
    errors: UploadedModelFileError[];
    message: string;
    success: false;
  };
  message: string;
  success: boolean;
};

export type UploadedModelFileError = {
  date: string;
  error_code: string;
  error_message: [string];
};
