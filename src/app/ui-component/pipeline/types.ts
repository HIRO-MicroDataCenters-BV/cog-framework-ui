export interface IRunStatus {
  phase: number;
  error: boolean;
}

export interface IRun {
  name: string;
  experiment: string;
  status: IRunStatus;
  version: number;
  startAt: Date;
  completed: boolean;
}

export interface IPipelineStatusType {
  name: string;
  key: string;
  error: boolean;
  completed: boolean;
}
