export interface DatasetInfo {
  data: DataSetData;
  errors: any;
  message: string;
  success: boolean;
}

export interface DatasetByName {
  data: DataSetData[];
  errors?: any;
  message: string;
  success: boolean;
}

export interface DatasetById {
  data: Dataset;
  errors?: any;
  message: string;
  success: boolean;
}

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
  errors: undefined | UploadDatasetError;
  message: string;
  success: boolean;
}

export interface UploadDatasetError {
  date: string;
  error_code: string;
  error_message: [string];
}
