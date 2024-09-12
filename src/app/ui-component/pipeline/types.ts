interface IRunDataInputOutputData {
  file: string;
  plain: string;
}

interface IRunDataDetails {
  taskId: string;
  taskName: string;
  status: number;
}
interface IRunDataInputOutput {
  inputParameter: string;
  url: string;
  inputArtiacts: string;
  outputArtifacts: string;
  data: IRunDataInputOutputData;
}

export interface IRunData {
  inputOutput: IRunDataInputOutput;
  details: IRunDataDetails;
  logs: string;
  events: string;
}

export interface IRunStatus {
  phase: number;
  error: boolean;
}

export interface IRun {
  id: string | number;
  name: string;
  experiment: string;
  status: IRunStatus;
  version: number;
  startAt: Date | null;
  endAt: Date | null;
  completed: boolean;
  data?: IRunData;
}

export interface IPipelineStatusType {
  name: string;
  key: string;
  error: boolean;
  completed: boolean;
  icon?: string;
}
