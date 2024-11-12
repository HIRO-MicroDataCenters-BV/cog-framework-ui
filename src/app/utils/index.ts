import { Pipeline, PipelineTask } from 'src/app/model/Pipeline';
import { environment } from 'src/environments/environment';

export const getFormattedDiff = (
  startedAt: string,
  finishedAt: string,
): string => {
  if (startedAt) {
    const from = new Date(startedAt);
    const to = finishedAt ? new Date(finishedAt) : new Date();
    const differenceInMs = to.getTime() - from.getTime();
    const differenceInSeconds = Math.floor(differenceInMs / 1000);
    const seconds = differenceInSeconds % 60;
    const minutes = Math.floor(differenceInSeconds / 60) % 60;
    const hours = Math.floor(differenceInSeconds / 3600);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedTime;
  }
  return '';
};

export const getRoot = (data: Pipeline): PipelineTask => {
  const tasks = data.task_structure;
  const nodes = Object.keys(data.task_structure);
  return tasks[nodes[0]];
};

export const flatten = (
  data: PipelineTask | PipelineTask[],
  level = 0,
  parent: PipelineTask | null = null,
) => {
  const result: unknown[] = [];

  if (!data) {
    return result;
  }

  if (Array.isArray(data)) {
    data.forEach((item) => result.push(...flatten(item, level + 1, parent)));
  } else {
    result.push({ ...data, level, parent });
    result.push(...flatten(data.children, level + 1, data));
  }

  return result;
};

export const isEmpty = (
  value: string | number | boolean | null | undefined | object,
) => {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    Object.keys(value).length === 0
  );
};

export const buildImgURL = (url: string): string => {
  return `${environment.appURL}/s3/get_image?url=${url}`;
};
