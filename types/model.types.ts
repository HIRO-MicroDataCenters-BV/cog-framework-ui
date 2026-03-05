export type ModelRunParam = {
  key: string;
  value: string;
};

export type ModelRunMetric = {
  key: string;
  value: string | number;
};

export type ModelRunTag = {
  key: string;
  value: string;
};

export interface ModelRun {
  params?: ModelRunParam[];
  metrics?: ModelRunMetric[];
  tags?: ModelRunTag[];
}

export interface ModelDetail {
  name: string;
  type: string;
  description: string;
  id: string;
  version: number;
  last_modified_time: string;
  register_date: string;
  register_user_id: string;
  last_modified_user_id: string;
  run?: ModelRun;
}

export interface ModelArtifactFile {
  name: string;
  artifact_path: string;
}

export interface ModelArtifacts {
  artifact_uri?: string;
  model_files?: ModelArtifactFile[];
}

export interface ModelAssociations {
  model_id?: string;
  model_name?: string;
  model_description?: string;
  register_date?: string;
  artifacts?: ModelArtifacts;
}

export interface ModelSummary {
  id: string;
  name: string;
  type: string;
  description?: string;
  version: number;
  last_modified_time: string;
  register_date: string;
  register_user_id: string;
  last_modified_user_id: string;
}

export type ModelOverviewContent = ModelDetail;
