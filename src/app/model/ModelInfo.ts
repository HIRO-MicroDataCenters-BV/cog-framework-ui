export interface ModelInfo {
  data: Model[];
  errors?: { date: string; error_code: string; error_message: string }[];
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
  isDeployed: boolean;
}

export type GetModelParams = {
  id?: string;
  name?: string;
};
