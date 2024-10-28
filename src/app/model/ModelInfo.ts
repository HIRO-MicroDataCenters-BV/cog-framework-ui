import { Pagination } from './General';

export interface ModelInfo {
  data: Model[];
  message: string;
  pagination: Pagination;
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
  limit?: number;
  page?: number;
  pageSize?: number;
  key?: string;
  //TODO: remove after standarizide
  metrics_limit?: number;
  metrics_page?: number;
  artifacts_limit?: number;
  artifacts_page?: number;
};
