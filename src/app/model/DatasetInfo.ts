export interface DatasetInfo {
  data: DataSetData[];
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}

export interface DatasetById {
  data: DataSetData;
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}

export type GetDatasetParams = string;

export interface Dataset {
  dataset_id: number;
  dataset_name: string;
}

export interface DataSetData {
  data_source_type: number;
  description: string;
  id: number;
  last_modified_time: string;
  last_modified_user_id: number;
  register_date_time: string;
  train_and_inference_type: number;
  user_id: number;
}

export interface UploadedDataset {
  data: DataSetData | undefined;
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
