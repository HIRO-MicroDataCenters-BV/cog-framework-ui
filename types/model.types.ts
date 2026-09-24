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

export interface ModelServing {
  isvc_name: string;
  served_model_url: string;
  status: 'ready' | 'pending' | 'failed' | string;
  model_id: string | null;
  model_name: string | null;
  model_version: string | null;
  dataset_id: string | null;
  creation_timestamp: string;
  age: string;
  latest_ready_revision: string;
  traffic_percentage: number;
  has_canary: boolean;
  stable_revision: string | null;
  canary_revision: string | null;
  stable_traffic_percent: number | null;
  canary_traffic_percent: number | null;
  canary_model_id?: string | null;
  canary_model_version?: string | null;
}

export interface ModelServingResponse {
  status_code: number;
  message: string;
  data: ModelServing[];
}

/** `GET /models-serving/{isvc_name}/models` payload. */
export interface ServedModelsData {
  isvc_name: string;
  served_model_url: string;
  /** Model names the service answers to: the base plus one per LoRA adapter. */
  models: string[];
}

/** `POST /models-serving/{isvc_name}/completions` body. */
export interface ServedCompletionRequest {
  model: string;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop?: string[];
}

/** OpenAI-style completion object returned in `data` by the completions route. */
export interface ServedCompletionData {
  id?: string;
  model?: string;
  choices: Array<{ text: string; index?: number; finish_reason?: string }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}
