import { Pagination } from './General';

export interface PipelineTaskInputOutput {
  name: string;
  value: string;
}

export interface PipelineTaskResourcesDuration {
  cpu: number;
  memory: number;
}

export interface S3 {
  key: string;
}

export interface PipelineTask {
  id: string;
  podName: string;
  name: string;
  inputs: PipelineTaskInputOutput[];
  outputs: PipelineTaskInputOutput[];
  status:
    | 'pending'
    | 'running'
    | 'succeeded'
    | 'skipped'
    | 'failed'
    | 'error'
    | 'omitted';
  startedAt: string;
  finishedAt: string;
  resourcesDuration: PipelineTaskResourcesDuration;
  children: PipelineTask[];
  parent?: PipelineTask;
}

export interface PipelineTaskInputOutputArtifactsItem {
  name: string;
  optional?: string | null;
  s3: S3;
  path: string | null;
}

export interface PipelineTaskInputOutputArtifacts {
  artifacts: PipelineTaskInputOutputArtifactsItem[];
}

export interface PipelineTaskNode {
  id: string;
  podName: string;
  name: string;
  inputs: PipelineTaskInputOutput[];
  outputs?: PipelineTaskInputOutputArtifacts;
  status:
    | 'pending'
    | 'running'
    | 'succeeded'
    | 'skipped'
    | 'failed'
    | 'error'
    | 'omitted';
  startedAt: string;
  finishedAt: string;
  resourcesDuration: PipelineTaskResourcesDuration;
  //children: PipelineTaskStructure | PipelineTask[];
  children: PipelineTask[];
  parent?: PipelineTask;
}

export interface PipelineTaskStructure {
  [key: string]: PipelineTask;
}

export interface Pipeline {
  run_id: string | null;
  pipeline_workflow_name: string;
  task_structure: PipelineTaskStructure;
}

export interface PipelineStatusType {
  name: string;
  key: string;
  error: boolean;
  completed: boolean;
  icon?: string;
}

export interface PipelineTreeNode {
  id: string;
  parentId: string | null;
  status: PipelineTask['status'];
  name: string;
}

export interface PipelineTreeNodeConnection {
  from: string;
  to: string;
  label: string;
}

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
  pagination: Pagination;
}
