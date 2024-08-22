export interface DataSetDetailInfo {
  data: Data;
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}

export interface Data {
  dataset_files: DatasetFiles;
  dataset_info: DatasetData;
  related_model: RelatedModel[];
}

export interface DatasetFiles {
  files: File[];
  tables: Table[];
}

export interface File {
  file_id: number;
  file_name: string;
}

export interface Table {
  table_id: number;
  dburl: string;
}

export interface DatasetData {
  author: number;
  dataset_description: string;
  dataset_id: number;
  dataset_name: string;
  register_date: string;
}

export interface RelatedModel {
  linked_time: string;
  model_id: number;
}

export interface DatasetFilesInfo {
  id: number;
  name: string;
}
