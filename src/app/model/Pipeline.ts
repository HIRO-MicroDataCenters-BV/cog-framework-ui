export interface PipelineTaskInputOutput {
  name: string;
  value: string;
}

export interface PipelineTaskResourcesDuration {
  cpu: number;
  memory: number;
}

export interface PipelineTask {
  id: string;
  podName: string;
  name: string;
  inputs: PipelineTaskInputOutput[];
  outputs: PipelineTaskInputOutput[];
  status: 'Pending' | 'Running' | 'Succeeded' | 'Skipped' | 'Failed' | 'Error';
  startedAt: Date;
  finishedAt: Date;
  resourcesDuration: PipelineTaskResourcesDuration;
  children: PipelineTaskStructure;
}

export interface PipelineTaskStructure {
  [key: string]: PipelineTask;
}

export interface Pipeline {
  run_id: string | null;
  pipeline_workflow_name: string;
  task_structure: PipelineTaskStructure;
}
/*
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
*/

export type GetPipelineParams = {
  id?: string;
  name?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  key?: string;
  run_id?: string;
  run_name?: string;
  pipeline_id?: string;
  pipeline_name?: string;
};

export interface PipelineResponse {
  data: Pipeline;
  errors?: { date: string; error_code: string; error_message: string }[];
  message: string;
  success: boolean;
}
