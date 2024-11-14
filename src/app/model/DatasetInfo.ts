export interface DatasetInfo {
  data: DatasetData[];
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}

export type GetDatasetParams = {
  id?: string;
  name?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  dataset_id?: number | string;
};

export interface Dataset {
  dataset_id: number;
  dataset_name: string;
}

export interface DatasetData {
  data_source_type: number;
  description: string;
  id: number;
  last_modified_time: string;
  last_modified_user_id: number;
  register_date_time: string;
  train_and_inference_type: number;
  user_id: number;
  author: string;
}

export interface UploadedDataset {
  data: DatasetData | undefined;
  error?: {
    errors: UploadDatasetError[];
    message: string;
    success: false;
  };
  message: string;
  success: boolean;
}

export interface UploadDatasetError {
  date: string;
  error_code: string;
  error_message: [string];
}

export const DatesetTypeEnum = {
  TRAIN_DATA_SET_TYPE: '0',
  INFERENCE_DATA_SET_TYPE: '1',
  BOTH_TYPE: '2',
} as const;

export type DatesetType =
  (typeof DatesetTypeEnum)[keyof typeof DatesetTypeEnum];

export const DatesetTypeWithLabels = {
  [DatesetTypeEnum.TRAIN_DATA_SET_TYPE]: 'Train Data',
  [DatesetTypeEnum.INFERENCE_DATA_SET_TYPE]: 'Inference Data',
  [DatesetTypeEnum.BOTH_TYPE]: 'Both',
} as const;
