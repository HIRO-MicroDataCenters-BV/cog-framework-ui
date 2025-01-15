import { apiResponseSchema } from "~/schemas/response.schema";

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase;
  const accessTokenKey = "access_token";
  const token = useLocalStorage(accessTokenKey, null);

  const getHeaders = (isFormData: boolean = false) => {
    const headers: { "Content-Type"?: string; Authorization?: string } = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    if (token.value) {
      headers["Authorization"] = `Bearer ${token.value}`;
    }
    return headers;
  };

  const request = async (
    url: string,
    method: string = "GET",
    body?: unknown
  ) => {
    const isFormData = body instanceof FormData;

    const opts: RequestInit = {
      method,
      headers: getHeaders(isFormData),
      ...(method !== "DELETE" &&
        method !== "GET" && { body: isFormData ? body : JSON.stringify(body) }),
    };

    try {
      const res = await fetch(`${baseUrl}${url}`, opts);
      if (!res.ok) {
        switch (res.status) {
          case 401:
            useLocalStorage(accessTokenKey, null);
            token.value = null;
            return null;
            break;
          default:
            return await res.json();
        }
      }
      return await res.json();
    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    }
  };

  return {
    login: async (username: string, password: string) => {
      const data = { username, password };
      const res = await request(`/auth/login`, "POST", data);
      if (res.token) {
        useLocalStorage(accessTokenKey, res.token);
        token.value = res.token;
      }
      return res;
    },
    getModels: async (
      params: {
        model_id?: number;
        last_days?: number;
        model_name?: string;
      } = {}
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      const res = await request(`/models?${q}`);
      return apiResponseSchema.parse(res);
    },
    registerModel: async (data: unknown) => {
      return request(`/models`, "POST", data);
    },
    updateModel: async (model_id: number, data: unknown) => {
      return request(`/models/${model_id}`, "PUT", data);
    },
    deleteModel: async (model_id: number) => {
      return request(`/models/${model_id}`, "DELETE");
    },
    getModelDetails: async (
      params: { model_id?: number; model_name?: string } = {}
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      return request(`/models/details?${q}`);
    },
    downloadModelFile: async (
      params: { model_id?: number; model_name?: string } = {}
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>
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
      files.forEach((file) => data.append("files", file));
      data.append("model_id", model_id);
      data.append("file_type", file_type);
      data.append("file_description", file_description);
      return request(`/models/file`, "POST", data);
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
      files.forEach((file) => data.append("files", file));
      data.append("model_id", model_id);
      data.append("file_id", file_id);
      data.append("file_description", file_description);
      return request(`/models/file/version`, "PUT", data);
    },
    fetchModelFileDetails: async (file_name: string, model_id: number) => {
      return request(`/models/file/${file_name}/details?model_id=${model_id}`);
    },
    deleteModelFile: async (file_id: number) => {
      return request(`/models/file/${file_id}`, "DELETE");
    },
    fetchModelUri: async (uri: string) => {
      return request(`/models/uri?uri=${uri}`);
    },
    registerModelUri: async (data: unknown) => {
      return request(`/models/uri`, "POST", data);
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
      files.forEach((file) => data.append("files", file));
      data.append("model_name", model_name);
      data.append("file_type", file_type);
      data.append("description", description);
      return request(`/models/save`, "POST", data);
    },
    deployModelToCogflow: async (data: unknown) => {
      return request(`/models/service/deploy`, "POST", data);
    },
    undeployModel: async (svc_name: string) => {
      return request(`/models/service/undeploy?svc_name=${svc_name}`, "DELETE");
    },
    fetchDatasets: async (
      params: { name?: string; dataset_id?: number; last_days?: number } = {}
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      return request(`/datasets?${q}`);
    },
    registerDataset: async ({
      files,
      name,
      dataset_type,
      description,
    }: {
      files: File[];
      name: string;
      dataset_type: string;
      description: string;
    }) => {
      const data = new FormData();
      files.forEach((file) => data.append("files", file));
      data.append("dataset_name", name);
      data.append("dataset_type", dataset_type);
      data.append("description", description);
      return request(`/datasets`, "POST", data);
    },
    deleteDataset: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}`, "DELETE");
    },
    linkDatasetModel: async (dataset_id: number, model_id: number) => {
      return request(`/datasets/${dataset_id}/models/${model_id}/link`, "POST");
    },
    unlinkDatasetModel: async (dataset_id: number, model_id: number) => {
      return request(
        `/datasets/${dataset_id}/models/${model_id}/unlink`,
        "POST"
      );
    },
    datasetTableUpdate: async (data: unknown) => {
      return request(`/datasets/table/register`, "PUT", data);
    },
    datasetTableRegister: async (data: unknown) => {
      return request(`/datasets/table/register`, "POST", data);
    },
    fetchTables: async (url: string) => {
      return request(`/dataset/tables?url=${url}`);
    },
    datasetKafkaRegister: async (data: unknown) => {
      return request(`/datasets/kafka/register`, "POST", data);
    },
    fetchKafkaServerDetails: async (server_id: number) => {
      return request(`/datasets/kafka/server/details?server_id=${server_id}`);
    },
    fetchKafkaDatasetDetails: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}/kafka`);
    },
    fetchFileDatasetsDetails: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}/file`);
    },
    fetchTableDetailsForDatasets: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}/table`);
    },
    getMetricsDetails: async (
      params: { model_id?: number; model_name?: string } = {}
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      return request(`/validation/metrics?${q}`);
    },
    uploadMetricsDetails: async (data: unknown) => {
      return request(`/validation/metrics`, "POST", data);
    },
    getArtifactsDetails: async (
      params: { model_id?: number; model_name?: string } = {}
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      return request(`/validation/artifacts?${q}`);
    },
    uploadValidationArtifact: async (data: unknown) => {
      return request(`/validation/artifact`, "POST", data);
    },
    getImage: async (url: string) => {
      return request(`/s3/get_image?url=${url}`);
    },
    fetchModelRecommend: async (
      params: { model_name?: string; classification_score?: string[] } = {}
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      return request(`/models/recommend?${q}`);
    },
    postPipelineDetails: async (data: unknown) => {
      return request(`/pipeline`, "POST", data);
    },
    getPipelineByModelId: async (model_id: number) => {
      return request(`/pipeline/${model_id}`);
    },
    getRunDetailsByPipelineId: async (pipeline_id: string) => {
      return request(`/pipeline/runs/${pipeline_id}`);
    },
    deleteRunDetailsByPipelineId: async (pipeline_id: string) => {
      return request(`/pipeline/runs/${pipeline_id}`, "DELETE");
    },
    deletePipelineByPipelineId: async (pipeline_id: string) => {
      return request(`/pipeline/${pipeline_id}`, "DELETE");
    },
    listPipelinesByName: async (pipeline_name: string) => {
      return request(`/pipelines?pipeline_name=${pipeline_name}`);
    },
    getInferenceLogsByServiceName: async (params: {
      namespace: string;
      inference_service: string;
      container_name: string;
    }) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      return request(`/inferenceservice/logs?${q}`);
    },
    getPipelineComponentByPipeline: async (
      params: { pipeline_id?: string; pipeline_name?: string } = {}
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      return request(`/pipelines/component?${q}`);
    },
    getPipelineComponentByRun: async (
      params: { run_id?: string; run_name?: string } = {}
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      return request(`/pipelines/component/run?${q}`);
    },
    getPipelineTask: async (params: {
      task_id: string;
      run_id?: string;
      run_name?: string;
    }) => {
      const q = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      return request(`/pipelines/task?${q}`);
    },
    healthCheck: async () => {
      return request(`/health`);
    },
  };
};
