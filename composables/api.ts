import {
  apiErrorResponseSchema,
  apiResponseSchema,
} from '~/schemas/response.schema';

/**
 * Fetch data from the API
 * @returns returns the API object
 */
export const useApi = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase;
  const accessTokenKey = 'access_token';
  const token = useLocalStorage(accessTokenKey, null);
  console.log('baseUrl', baseUrl);

  /**
   * Function to get headers
   * @param isFormData
   * @returns
   */
  const getHeaders = (isFormData: boolean = false) => {
    const headers: { 'Content-Type'?: string; Authorization?: string } = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }
    return headers;
  };

  /**
   * Function to make a request
   * @param url
   * @param method
   * @param body
   * @returns
   */
  const request = async (
    url: string,
    method: string = 'GET',
    body?: unknown,
    options?: { showToast?: boolean },
  ) => {
    const isFormData = body instanceof FormData;
    const showToast = options?.showToast !== false;
    const toaster = useToaster();

    const opts: RequestInit = {
      method,
      headers: getHeaders(isFormData),
      ...(method !== 'DELETE' &&
        method !== 'GET' && { body: isFormData ? body : JSON.stringify(body) }),
    };

    try {
      console.log('request', `${baseUrl}${url}`, opts);
      const res = await fetch(`${baseUrl}${url}`, opts);
      const data = await res.json();
      if (!res.ok) {
        switch (res.status) {
          case 401:
            useLocalStorage(accessTokenKey, null);
            token.value = null;
            if (showToast) toaster.show('error', 'unauthorized');
            return null;
        }
      }

      const result =
        res.status >= 400 && res.status < 600
          ? apiErrorResponseSchema.parse(data)
          : apiResponseSchema.parse(data);
      return result;
    } catch (err) {
      if (method === 'DELETE') {
        return;
      } else {
        console.error('Fetch error:', err);
        if (showToast) toaster.show('error', 'connection_error');
        throw err;
      }
    }
  };

  return {
    // Models API
    getModels: async (
      params: {
        id?: number;
        last_days?: number;
        name?: string;
      } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/models?${q}`);
      return res;
    },
    postModel: async (data: unknown) => {
      return request(`/models`, 'POST', data);
    },
    patchModel: async (id: number, data: unknown) => {
      return request(`/models/${id}`, 'PATCH', data);
    },
    deleteModel: async (id: number) => {
      return request(`/models/${id}`, 'DELETE');
    },
    getModelAssociationsById: async (id: number) => {
      return request(`/models/${id}/associations`);
    },
    getModelAssociationsByName: async (name: string) => {
      return request(`/models/associations?name=${name}`);
    },
    postModelFile: async ({
      id,
      files,
      file_type,
      file_description,
    }: {
      id: number;
      files: File[];
      file_type: string;
      file_description?: string;
    }) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('file_type', file_type);
      if (file_description) data.append('file_description', file_description);
      return request(`/models/${id}/file`, 'POST', data);
    },
    getModelFile: async (
      params: { model_id?: number; model_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/models/file?${q}`);
    },
    putModelFile: async ({
      files,
      model_id,
      file_id,
      file_description,
    }: {
      files: File[];
      model_id: string;
      file_id: string;
      file_description: string;
    }) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('model_id', model_id);
      data.append('file_id', file_id);
      data.append('file_description', file_description);
      return request(`/models/file/version`, 'PUT', data);
    },
    getModelFileDetails: async (file_name: string, model_id: number) => {
      return request(`/models/file/${file_name}/details?model_id=${model_id}`);
    },
    deleteModelFile: async (file_id: number) => {
      return request(`/models/file/${file_id}`, 'DELETE');
    },
    getModelUri: async (uri: string) => {
      return request(`/models/uri?uri=${uri}`);
    },
    postModelUri: async (data: unknown) => {
      return request(`/models/uri`, 'POST', data);
    },
    postModelSave: async ({
      files,
      model_name,
      file_type,
      description,
    }: {
      files: File[];
      model_name: string;
      file_type: string;
      description: string;
    }) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('model_name', model_name);
      data.append('file_type', file_type);
      data.append('description', description);
      return request(`/models/save`, 'POST', data);
    },
    postModelDeploy: async (data: unknown) => {
      return request(`/models/service/deploy`, 'POST', data);
    },
    deleteModelUndeploy: async (svc_name: string) => {
      return request(`/models/service/undeploy?svc_name=${svc_name}`, 'DELETE');
    },
    getModelRecommend: async (
      params: { model_name?: string; classification_score?: string[] } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/models/recommend?${q}`);
      return res;
    },
    getModelDetails: async (params: { id?: number; name?: string } = {}) => {
      if (params.id) {
        return request(`/models/${params.id}/associations`);
      }
      if (params.name) {
        return request(`/models/associations?name=${params.name}`);
      }
      return null;
    },
    // Datasets API
    getDatasets: async (
      params: { name?: string; id?: number; last_days?: number } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/datasets?${q}`);
      return res;
    },
    putDatasetFile: async ({
      id,
      files,
      name,
      dataset_type,
      description,
    }: {
      id: number;
      files: File[];
      name: string;
      dataset_type: number;
      description?: string;
    }) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('id', id.toString());
      data.append('name', name);
      data.append('dataset_type', dataset_type.toString());
      if (description) data.append('description', description);
      return request(`/datasets/file`, 'PUT', data);
    },
    postDatasetFile: async ({
      files,
      name,
      dataset_type,
      description,
    }: {
      files: File[];
      name: string;
      dataset_type: number;
      description?: string;
    }) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('name', name);
      data.append('dataset_type', dataset_type.toString());
      if (description) data.append('description', description);
      return request(`/datasets/file`, 'POST', data);
    },
    deleteDatasetFile: async (id: number) => {
      return request(`/datasets/file/${id}`, 'DELETE');
    },
    postDatasetModelLink: async (dataset_id: number, model_id: number) => {
      return request(`/datasets/${dataset_id}/models/${model_id}/link`, 'POST');
    },
    postDatasetModelUnlink: async (dataset_id: number, model_id: number) => {
      return request(
        `/datasets/${dataset_id}/models/${model_id}/unlink`,
        'POST',
      );
    },
    putDatasetTable: async (data: unknown) => {
      return request(`/datasets/table`, 'PUT', data);
    },
    postDatasetTable: async (data: unknown) => {
      return request(`/datasets/table`, 'POST', data);
    },
    getDatasetTables: async (url: string) => {
      return request(`/datasets/tables?url=${url}`);
    },
    postDatasetBroker: async (data: unknown) => {
      return request(`/datasets/broker`, 'POST', data);
    },
    deleteDatasetBroker: async (id: number) => {
      return request(`/datasets/broker/${id}`, 'DELETE');
    },
    patchDatasetBroker: async (id: number, data: unknown) => {
      return request(`/datasets/broker/${id}`, 'PATCH', data);
    },
    postDatasetTopic: async (broker_id: number, data: unknown) => {
      return request(`/datasets/broker/${broker_id}/topic`, 'POST', data);
    },
    patchDatasetTopic: async (id: number, data: unknown) => {
      return request(`/datasets/broker/topic/${id}`, 'PATCH', data);
    },
    deleteDatasetTopic: async (id: number) => {
      return request(`/datasets/topic/${id}`, 'DELETE');
    },
    getDatasetBrokerDetails: async () => {
      return request(`/datasets/broker/details`);
    },
    getDatasetTopicDetails: async () => {
      return request(`/datasets/topic/details`);
    },
    postDatasetMessage: async (data: unknown) => {
      return request(`/datasets/message`, 'POST', data);
    },
    getDatasetMessageDetails: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}/message/details`);
    },
    getDatasetFileDetails: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}/file`);
    },
    getDatasetTableDetails: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}/table`);
    },
    getDatasetTableRecords: async (dataset_id: number, limit?: number) => {
      const params = limit ? `?limit=${limit}` : '';
      return request(`/datasets/${dataset_id}/table/records${params}`);
    },
    getDatasetTopicData: async (
      dataset_id: number,
      no_of_records?: number,
      offset_reset?: 'earliest' | 'latest',
    ) => {
      const params = new URLSearchParams();
      if (no_of_records)
        params.append('no_of_records', no_of_records.toString());
      if (offset_reset) params.append('offset_reset', offset_reset);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/datasets/${dataset_id}/topic/data${query}`);
    },
    deleteDatasetMessage: async (id: number) => {
      return request(`/datasets/message/${id}`, 'DELETE');
    },
    // Validation API
    getValidationMetrics: async (
      params: { model_id?: number; model_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/validation/metrics?${q}`);
      return res;
    },
    postValidationMetrics: async (data: unknown) => {
      return request(`/validation/metrics`, 'POST', data);
    },
    getValidationArtifacts: async (
      params: { model_id?: number; model_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/validation/artifacts?${q}`);
      return res;
    },
    postValidationArtifact: async (data: unknown) => {
      return request(`/validation/artifact`, 'POST', data);
    },
    getS3Image: async (url: string) => {
      return request(`/s3/get_image?url=${url}`);
    },
    // Pipeline API
    postPipeline: async (data: unknown) => {
      return request(`/pipeline`, 'POST', data);
    },
    getPipelineByModelId: async (model_id: number) => {
      return request(`/pipeline/${model_id}`);
    },
    getPipelineRuns: async (pipeline_id: string) => {
      return request(`/pipeline/runs/${pipeline_id}`);
    },
    deletePipelineRuns: async (pipeline_id: string) => {
      return request(`/pipeline/runs/${pipeline_id}`, 'DELETE');
    },
    deletePipeline: async (pipeline_id: string) => {
      return request(`/pipeline/${pipeline_id}`, 'DELETE');
    },
    getPipelines: async (pipeline_name: string) => {
      return request(`/pipelines?pipeline_name=${pipeline_name}`);
    },
    getPipelineRunsList: async () => {
      return request(`/pipelines/runs`);
    },
    getInferenceLogs: async (params: {
      inference_service_name: string;
      namespace?: string;
      container_name?: string;
    }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/inferenceservice/logs?${q}`);
    },
    getPipelineComponents: async (
      params: {
        pipeline_id?: string;
        pipeline_name?: string;
        pipeline_workflow_name?: string;
      } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pipelines/component?${q}`);
    },
    getPipelineComponentByRun: async (
      params: { run_id?: string; run_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pipelines/component/run?${q}`);
    },
    getPipelineTask: async (params: {
      task_id: string;
      run_id?: string;
      run_name?: string;
    }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pipelines/task?${q}`);
    },
    // Pod Management API
    getPodLogs: async (params: {
      pod_name: string;
      namespace?: string;
      container_name?: string;
    }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pod/logs?${q}`);
    },
    getPodEvents: async (params: { pod_name: string; namespace?: string }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pod/events?${q}`);
    },
    getPodDefinition: async (params: {
      pod_name: string;
      namespace?: string;
    }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pod/definition?${q}`);
    },
    getDeployments: async (namespace?: string) => {
      const params = namespace ? `?namespace=${namespace}` : '';
      return request(`/deployments${params}`);
    },
    // Components API
    getComponents: async () => {
      return request(`/components`);
    },
    postComponent: async (data: unknown) => {
      return request(`/components`, 'POST', data);
    },
    deleteComponent: async (component_id: number) => {
      return request(`/components/${component_id}`, 'DELETE');
    },
    // Pipeline Components API
    getPipelineComponentsList: async () => {
      return request(`/pipeline-components`);
    },
    postPipelineComponent: async (data: unknown) => {
      return request(`/pipeline-components`, 'POST', data);
    },
    deletePipelineComponent: async (pipeline_component_id: number) => {
      return request(`/pipeline-components/${pipeline_component_id}`, 'DELETE');
    },
    // Users API
    getUsers: async () => {
      return request(`/users`);
    },
    postUser: async (data: unknown) => {
      return request(`/users`, 'POST', data);
    },
    getUser: async (id: number) => {
      return request(`/users/${id}`);
    },
    patchUser: async (id: number, data: unknown) => {
      return request(`/users/${id}`, 'PATCH', data);
    },
    deleteUser: async (id: number) => {
      return request(`/users/${id}`, 'DELETE');
    },
    // Health Check
    getHealth: async () => {
      return request(`/health`);
    },
  };
};
