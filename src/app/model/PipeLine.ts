export interface PipelineResponse {
  data: Pipeline[];
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}

export interface Pipeline {
  createdAt_in_sec: string;
  description: string;
  model_id: number;
  name: string;
  parameters: string;
  pipeline_spec: string;
  pipeline_spec_uri: string;
  status: string;
  uuid: string;
}
