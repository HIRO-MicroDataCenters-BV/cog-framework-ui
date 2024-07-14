export interface ModelInfo {
  data: Model[];
  errors?: any;
  message: string;
  success: boolean;
}

export interface ModelInfoById {
  data: Model;
  errors?: any;
  message: string;
  success: boolean;
}

export interface Model {
  id: number;
  last_modified_time: string;
  last_modified_user_id: number;
  name: string;
  register_date: string;
  register_user_id: number;
  type: string;
  version: string;
}
