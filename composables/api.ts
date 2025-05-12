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
    registerModel: async (data: unknown) => {
      return request(`/models`, 'POST', data);
    },
    updateModel: async (id: number, data: unknown) => {
      return request(`/models/${id}`, 'PUT', data);
    },
    deleteModel: async (id: number) => {
      return request(`/models/${id}`, 'DELETE');
    },
    getModelDetails: async (params: { id?: number; name?: string } = {}) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/models/details?${q}`);
      return res;
    },
    downloadModelFile: async (
      params: { model_id?: number; model_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/models/file?${q}`);
    },
    uploadModelFile: async ({
      files,
      model_id,
      file_type,
      file_description,
    }: {
      files: File[];
      model_id: string;
      file_type: string;
      file_description: string;
    }) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('model_id', model_id);
      data.append('file_type', file_type);
      data.append('file_description', file_description);
      return request(`/models/file`, 'POST', data);
    },
    updateModelFile: async ({
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
    fetchModelFileDetails: async (file_name: string, model_id: number) => {
      return request(`/models/file/${file_name}/details?model_id=${model_id}`);
    },
    deleteModelFile: async (file_id: number) => {
      return request(`/models/file/${file_id}`, 'DELETE');
    },
    fetchModelUri: async (uri: string) => {
      return request(`/models/uri?uri=${uri}`);
    },
    registerModelUri: async (data: unknown) => {
      return request(`/models/uri`, 'POST', data);
    },
    saveModelDetails: async ({
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
    deployModelToCogflow: async (data: unknown) => {
      return request(`/models/service/deploy`, 'POST', data);
    },
    undeployModel: async (svc_name: string) => {
      return request(`/models/service/undeploy?svc_name=${svc_name}`, 'DELETE');
    },
    fetchDatasets: async (
      params: { name?: string; id?: number; last_days?: number } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/datasets?${q}`);
      return res;
    },
    datasetFileUpdate: async ({
      files,
      name,
      dataset_type,
      description,
    }: {
      files: File[];
      name: string;
      dataset_type: number;
      description: string;
    }) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('name', name);
      data.append('dataset_type', dataset_type.toString());
      data.append('description', description);
      return request(`/datasets/file`, 'PUT', data);
    },
    datasetFileRegister: async ({
      files,
      name,
      dataset_type,
      description,
    }: {
      files: File[];
      name: string;
      dataset_type: number;
      description: string;
    }) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('name', name);
      data.append('dataset_type', dataset_type.toString());
      data.append('description', description);
      return request(`/datasets/file`, 'POST', data);
    },
    deleteDatasetFile: async (id: number) => {
      return request(`/datasets/file/${id}`, 'DELETE');
    },
    deleteDatasetBroker: async (id: number) => {
      return request(`/datasets/broker/${id}`, 'DELETE');
    },
    deleteDatasetTopic: async (id: number) => {
      return request(`/datasets/broker/${id}`, 'DELETE');
    },
    deleteDatasetMessage: async (id: number) => {
      return request(`/datasets/message/${id}`, 'DELETE');
    },
    linkDatasetModel: async (dataset_id: number, model_id: number) => {
      return request(`/datasets/${dataset_id}/models/${model_id}/link`, 'POST');
    },
    unlinkDatasetModel: async (dataset_id: number, model_id: number) => {
      return request(
        `/datasets/${dataset_id}/models/${model_id}/unlink`,
        'POST',
      );
    },
    datasetTableUpdate: async (data: unknown) => {
      return request(`/datasets/table`, 'PUT', data);
    },
    datasetTableRegister: async (data: unknown) => {
      console.log('data', data);
      return request(`/datasets/table`, 'POST', data);
    },
    fetchTables: async (url: string) => {
      const res = await request(`/dataset/tables?url=${url}`);
      return res;
    },
    datasetKafkaRegister: async (data: unknown) => {
      return request(`/datasets/kafka`, 'POST', data);
    },
    fetchKafkaServerDetails: async (server_id: number) => {
      const res = await request(
        `/datasets/kafka/server/details?server_id=${server_id}`,
      );
      return res;
    },
    fetchKafkaDatasetDetails: async (dataset_id: number) => {
      const res = await request(`/datasets/${dataset_id}/kafka`);
      return res;
    },
    fetchFileDatasetsDetails: async (dataset_id: number) => {
      const res = await request(`/datasets/${dataset_id}/file`);
      return res;
    },
    fetchTableDetailsForDatasets: async (dataset_id: number) => {
      const res = await request(`/datasets/${dataset_id}/table`);
      return res;
    },
    getMetricsDetails: async (
      params: { model_id?: number; model_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/validation/metrics?${q}`);
      return res;
    },
    uploadMetricsDetails: async (data: unknown) => {
      return request(`/validation/metrics`, 'POST', data);
    },
    getArtifactsDetails: async (
      params: { model_id?: number; model_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/validation/artifacts?${q}`);
      return res;
    },
    uploadValidationArtifact: async (data: unknown) => {
      return request(`/validation/artifact`, 'POST', data);
    },
    getImage: async (url: string) => {
      return request(`/s3/get_image?url=${url}`);
    },
    fetchModelRecommend: async (
      params: { model_name?: string; classification_score?: string[] } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/models/recommend?${q}`);
      return res;
    },
    postPipelineDetails: async (data: unknown) => {
      return request(`/pipeline`, 'POST', data);
    },
    getPipelineByModelId: async (model_id: number) => {
      const res = await request(`/pipeline/${model_id}`);
      return res;
    },
    getRunDetailsByPipelineId: async (pipeline_id: string) => {
      const res = await request(`/pipeline/runs/${pipeline_id}`);
      return res;
    },
    deleteRunDetailsByPipelineId: async (pipeline_id: string) => {
      return request(`/pipeline/runs/${pipeline_id}`, 'DELETE');
    },
    deletePipelineByPipelineId: async (pipeline_id: string) => {
      return request(`/pipeline/${pipeline_id}`, 'DELETE');
    },
    listPipelinesByName: async (pipeline_name: string) => {
      const res = await request(`/pipelines?pipeline_name=${pipeline_name}`);
      return res;
    },
    getInferenceLogsByServiceName: async (params: {
      namespace: string;
      inference_service: string;
      container_name: string;
    }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/inferenceservice/logs?${q}`);
      return res;
    },
    getPipelineComponentByPipeline: async (
      params: { pipeline_id?: string; pipeline_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/pipelines/component?${q}`);
      return res;
    },
    getPipelineComponentByRun: async (
      params: { run_id?: string; run_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/pipelines/component/run?${q}`);
      return res;
    },
    getPipelineTask: async (params: {
      task_id: string;
      run_id?: string;
      run_name?: string;
    }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/pipelines/task?${q}`);
      return res;
    },
    healthCheck: async () => {
      return request(`/health`);
    },
  };
};
