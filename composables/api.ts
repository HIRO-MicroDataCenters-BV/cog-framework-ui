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

  const exports = {
    // ===== MODELS =====
    /**
     * Get models list
     * GET /cogapi/models
     */
    getModels: async (
      params: {
        model_id?: number;
        id?: number; // Support both id and model_id
        last_days?: number;
        model_name?: string;
        name?: string; // Support name field from table filters
        page?: number;
        limit?: number;
        [key: string]: unknown; // Allow additional filter parameters
      } = {},
    ) => {
      const q = new URLSearchParams();
      // Handle both id and model_id
      const modelId = params.id || params.model_id;
      if (modelId) q.append('model_id', modelId.toString());
      if (params.last_days) q.append('last_days', params.last_days.toString());
      // Handle both model_name and name
      const modelName = params.model_name || params.name;
      if (modelName) q.append('model_name', modelName);
      // Note: The API doesn't seem to support pagination params based on OpenAPI spec
      // but we'll pass them if the backend adds support later
      if (params.page) q.append('page', params.page.toString());
      if (params.limit) q.append('limit', params.limit.toString());
      return request(`/models${q.toString() ? `?${q.toString()}` : ''}`);
    },

    /**
     * Register a new model
     * POST /cogapi/models
     */
    registerModel: async (data: {
      name: string;
      version: string;
      type: string;
      description: string;
    }) => {
      return request('/models', 'POST', data);
    },

    /**
     * Update model by ID
     * PATCH /cogapi/models/{id}
     */
    updateModel: async (
      id: number,
      data: {
        name?: string;
        version?: string;
        type?: string;
        description?: string;
      },
    ) => {
      return request(`/models/${id}`, 'PATCH', data);
    },

    /**
     * Delete model by ID
     * DELETE /cogapi/models/{id}
     */
    deleteModel: async (id: number) => {
      return request(`/models/${id}`, 'DELETE');
    },

    /**
     * Get model associations
     * GET /cogapi/models/{id}/associations
     */
    getModelAssociations: async (id: number) => {
      return request(`/models/${id}/associations`);
    },

    /**
     * Get all model associations
     * GET /cogapi/models/associations
     */
    getAllModelAssociations: async (model_name: string) => {
      return request(
        `/models/associations?model_name=${encodeURIComponent(model_name)}`,
      );
    },

    /**
     * Upload model file
     * POST /cogapi/models/{id}/file
     */
    uploadModelFile: async (
      id: number,
      data: {
        file_type: string;
        file_description?: string;
        files: File[];
      },
    ) => {
      const formData = new FormData();
      formData.append('file_type', data.file_type);
      if (data.file_description) {
        formData.append('file_description', data.file_description);
      }
      data.files.forEach((file) => formData.append('files', file));
      return request(`/models/${id}/file`, 'POST', formData);
    },

    /**
     * Update model file version
     * PUT /cogapi/models/file/version
     */
    updateModelFileVersion: async (data: {
      model_id: number;
      file_id: number;
      file_description?: string;
      files: File[];
    }) => {
      const formData = new FormData();
      formData.append('model_id', data.model_id.toString());
      formData.append('file_id', data.file_id.toString());
      if (data.file_description) {
        formData.append('file_description', data.file_description);
      }
      data.files.forEach((file) => formData.append('files', file));
      return request('/models/file/version', 'PUT', formData);
    },

    /**
     * Get model file details
     * GET /cogapi/models/file/{name}/details
     */
    getModelFileDetails: async (name: string, model_id: number) => {
      return request(
        `/models/file/${encodeURIComponent(name)}/details?model_id=${model_id}`,
      );
    },

    /**
     * Delete model file
     * DELETE /cogapi/models/file/{id}
     */
    deleteModelFile: async (id: number) => {
      return request(`/models/file/${id}`, 'DELETE');
    },

    /**
     * Get model files
     * GET /cogapi/models/file
     */
    getModelFiles: async (model_id: number, model_name?: string) => {
      const q = new URLSearchParams();
      q.append('model_id', model_id.toString());
      if (model_name) q.append('model_name', model_name);
      return request(`/models/file?${q.toString()}`);
    },

    /**
     * Get model URI
     * GET /cogapi/models/uri
     */
    getModelUri: async (uri: string) => {
      return request(`/models/uri?uri=${encodeURIComponent(uri)}`);
    },

    /**
     * Post model URI
     * POST /cogapi/models/uri
     */
    postModelUri: async (data: {
      file_type: string;
      model_id: number;
      description?: string;
      uri: string;
    }) => {
      return request('/models/uri', 'POST', data);
    },

    /**
     * Save model details
     * POST /cogapi/models/save
     */
    saveModelDetails: async (data: {
      name: string;
      file_type: string;
      description?: string;
      files: File[];
    }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('file_type', data.file_type);
      if (data.description) {
        formData.append('description', data.description);
      }
      data.files.forEach((file) => formData.append('files', file));
      return request('/models/save', 'POST', formData);
    },

    /**
     * Deploy model service
     * POST /cogapi/models/service/deploy
     */
    deployModelService: async (data: {
      name: string;
      version: string;
      isvc_name: string;
    }) => {
      return request('/models/service/deploy', 'POST', data);
    },

    /**
     * Undeploy model service
     * DELETE /cogapi/models/service/undeploy
     */
    undeployModelService: async (svc_name: string) => {
      return request(
        `/models/service/undeploy?svc_name=${encodeURIComponent(svc_name)}`,
        'DELETE',
      );
    },

    /**
     * Get model recommendations
     * GET /cogapi/models/recommend
     */
    getModelRecommendations: async (
      model_name: string,
      classification_score?: string[],
    ) => {
      const q = new URLSearchParams();
      q.append('model_name', model_name);
      if (classification_score) {
        classification_score.forEach((score) =>
          q.append('classification_score', score),
        );
      }
      return request(`/models/recommend?${q.toString()}`);
    },

    // ===== DATASETS =====
    /**
     * Get datasets
     * GET /cogapi/datasets
     */
    fetchDatasets: async (
      params: {
        name?: string;
        dataset_id?: number;
        id?: number; // Support both id and dataset_id
        last_days?: number;
        page?: number;
        limit?: number;
        [key: string]: unknown; // Allow additional filter parameters
      } = {},
    ) => {
      const q = new URLSearchParams();
      // Handle both id and dataset_id
      const datasetId = params.id || params.dataset_id;
      if (params.name) q.append('name', params.name);
      if (datasetId) q.append('dataset_id', datasetId.toString());
      if (params.last_days) q.append('last_days', params.last_days.toString());
      // Note: The API doesn't seem to support pagination params based on OpenAPI spec
      // but we'll pass them if the backend adds support later
      if (params.page) q.append('page', params.page.toString());
      if (params.limit) q.append('limit', params.limit.toString());
      return request(`/datasets${q.toString() ? `?${q.toString()}` : ''}`);
    },

    /**
     * Register dataset file
     * POST /cogapi/datasets/file
     */
    registerDatasetFile: async (data: {
      dataset_type: string;
      name: string;
      description?: string;
      files: File[];
    }) => {
      const formData = new FormData();
      formData.append('dataset_type', data.dataset_type);
      formData.append('name', data.name);
      if (data.description) {
        formData.append('description', data.description);
      }
      data.files.forEach((file) => formData.append('files', file));
      return request('/datasets/file', 'POST', formData);
    },

    /**
     * Update dataset file
     * PUT /cogapi/datasets/file
     */
    updateDatasetFile: async (data: {
      id: number;
      name?: string;
      description?: string;
      dataset_type?: string;
      files: File[];
    }) => {
      const formData = new FormData();
      formData.append('id', data.id.toString());
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.dataset_type) formData.append('dataset_type', data.dataset_type);
      data.files.forEach((file) => formData.append('files', file));
      return request('/datasets/file', 'PUT', formData);
    },

    /**
     * Delete dataset file
     * DELETE /cogapi/datasets/file/{id}
     */
    deleteDatasetFile: async (id: number) => {
      return request(`/datasets/file/${id}`, 'DELETE');
    },

    /**
     * Get dataset file
     * GET /cogapi/datasets/{id}/file
     */
    getDatasetFile: async (id: number) => {
      return request(`/datasets/${id}/file`);
    },

    /**
     * Register dataset table
     * POST /cogapi/datasets/table
     */
    registerDatasetTable: async (data: {
      dataset_type: string;
      name: string;
      description?: string;
      db_url: string;
      table_name: string;
      selected_fields?: string;
    }) => {
      return request('/datasets/table', 'POST', data);
    },

    /**
     * Update dataset table
     * PUT /cogapi/datasets/table
     */
    updateDatasetTable: async (data: {
      dataset_type: string;
      name: string;
      description?: string;
      db_url: string;
      table_name: string;
      selected_fields?: string;
    }) => {
      return request('/datasets/table', 'PUT', data);
    },

    /**
     * Get dataset table
     * GET /cogapi/datasets/{id}/table
     */
    getDatasetTable: async (id: number) => {
      return request(`/datasets/${id}/table`);
    },

    /**
     * Get dataset table records
     * GET /cogapi/datasets/{id}/table/records
     */
    getDatasetTableRecords: async (id: number, count: number) => {
      return request(`/datasets/${id}/table/records?count=${count}`);
    },

    /**
     * Get tables list
     * GET /cogapi/datasets/tables
     */
    getDatasetTables: async (url: string) => {
      return request(`/datasets/tables?url=${encodeURIComponent(url)}`);
    },

    /**
     * Register dataset broker
     * POST /cogapi/datasets/broker
     */
    registerDatasetBroker: async (data: {
      name: string;
      ip: string;
      port: number;
    }) => {
      return request('/datasets/broker', 'POST', data);
    },

    /**
     * Update dataset broker
     * PATCH /cogapi/datasets/broker/{id}
     */
    updateDatasetBroker: async (
      id: number,
      data: {
        name?: string;
        ip?: string;
        port?: number;
      },
    ) => {
      return request(`/datasets/broker/${id}`, 'PATCH', data);
    },

    /**
     * Delete dataset broker
     * DELETE /cogapi/datasets/broker/{id}
     */
    deleteDatasetBroker: async (id: number) => {
      return request(`/datasets/broker/${id}`, 'DELETE');
    },

    /**
     * Get broker details
     * GET /cogapi/datasets/broker/details
     */
    getDatasetBrokerDetails: async () => {
      return request('/datasets/broker/details');
    },

    /**
     * Register dataset topic
     * POST /cogapi/datasets/broker/{id}/topic
     */
    registerDatasetTopic: async (
      id: number,
      data: {
        name: string;
        schema?: string;
      },
    ) => {
      return request(`/datasets/broker/${id}/topic`, 'POST', data);
    },

    /**
     * Update dataset topic
     * PATCH /cogapi/datasets/broker/topic/{id}
     */
    updateDatasetTopic: async (
      id: number,
      data: {
        name?: string;
        schema?: string;
      },
    ) => {
      return request(`/datasets/broker/topic/${id}`, 'PATCH', data);
    },

    /**
     * Delete dataset topic
     * DELETE /cogapi/datasets/topic/{id}
     */
    deleteDatasetTopic: async (id: number) => {
      return request(`/datasets/topic/${id}`, 'DELETE');
    },

    /**
     * Get topic details
     * GET /cogapi/datasets/topic/details
     */
    getDatasetTopicDetails: async () => {
      return request('/datasets/topic/details');
    },

    /**
     * Get dataset topic data
     * GET /cogapi/datasets/{id}/topic/data
     */
    getDatasetTopicData: async (
      id: number,
      count: number,
      offset_reset?: string,
    ) => {
      const q = new URLSearchParams();
      q.append('count', count.toString());
      if (offset_reset) q.append('offset_reset', offset_reset);
      return request(`/datasets/${id}/topic/data?${q.toString()}`);
    },

    /**
     * Register dataset message
     * POST /cogapi/datasets/message
     */
    registerDatasetMessage: async (data: {
      dataset_type: string;
      name: string;
      description?: string;
      broker_id: number;
      topic_id: number;
    }) => {
      return request('/datasets/message', 'POST', data);
    },

    /**
     * Delete dataset message
     * DELETE /cogapi/datasets/message/{id}
     */
    deleteDatasetMessage: async (id: number) => {
      return request(`/datasets/message/${id}`, 'DELETE');
    },

    /**
     * Get dataset message details
     * GET /cogapi/datasets/{id}/message/details
     */
    getDatasetMessageDetails: async (id: number) => {
      return request(`/datasets/${id}/message/details`);
    },

    /**
     * Link dataset to model
     * POST /cogapi/datasets/{id}/models/{mid}/link
     */
    linkDatasetModel: async (dataset_id: number, model_id: number) => {
      return request(`/datasets/${dataset_id}/models/${model_id}/link`, 'POST');
    },

    /**
     * Unlink dataset from model
     * POST /cogapi/datasets/{id}/models/{mid}/unlink
     */
    unlinkDatasetModel: async (dataset_id: number, model_id: number) => {
      return request(
        `/datasets/${dataset_id}/models/${model_id}/unlink`,
        'POST',
      );
    },

    // ===== VALIDATION =====
    /**
     * Get validation metrics
     * GET /cogapi/validation/metrics
     */
    getValidationMetrics: async (model_id: number, model_name?: string) => {
      const q = new URLSearchParams();
      q.append('model_id', model_id.toString());
      if (model_name) q.append('model_name', model_name);
      return request(`/validation/metrics?${q.toString()}`);
    },

    /**
     * Post validation metrics
     * POST /cogapi/validation/metrics
     */
    postValidationMetrics: async (data: {
      model_name?: string;
      accuracy_score?: number;
      example_count?: number;
      f1_score?: number;
      log_loss?: number;
      precision_score?: number;
      recall_score?: number;
      roc_auc?: number;
      score?: number;
      cpu_consumption?: number;
      memory_utilization?: number;
    }) => {
      return request('/validation/metrics', 'POST', data);
    },

    /**
     * Get validation artifacts
     * GET /cogapi/validation/artifacts
     */
    getValidationArtifacts: async (model_id: number, model_name?: string) => {
      const q = new URLSearchParams();
      q.append('model_id', model_id.toString());
      if (model_name) q.append('model_name', model_name);
      return request(`/validation/artifacts?${q.toString()}`);
    },

    /**
     * Post validation artifact
     * POST /cogapi/validation/artifact
     */
    postValidationArtifact: async (data: {
      model_name?: string;
      validation_artifacts?: Record<string, unknown>;
    }) => {
      return request('/validation/artifact', 'POST', data);
    },

    // ===== PIPELINES =====
    /**
     * Create pipeline
     * POST /cogapi/pipeline
     */
    createPipeline: async (data: {
      uuid: string;
      model_id: number;
      name: string;
      description?: string;
      parameters?: string;
      status?: string;
      createdAt_in_sec: number;
      experiment_uuid?: string;
      pipeline_spec?: string;
      pipeline_spec_uri?: string;
    }) => {
      return request('/pipeline', 'POST', data);
    },

    /**
     * Get pipeline by model ID
     * GET /cogapi/pipeline/{model_id}
     */
    getPipelineByModelId: async (model_id: string) => {
      return request(`/pipeline/${model_id}`);
    },

    /**
     * Delete pipeline
     * DELETE /cogapi/pipeline/{pipeline_id}
     */
    deletePipeline: async (pipeline_id: string) => {
      return request(`/pipeline/${pipeline_id}`, 'DELETE');
    },

    /**
     * Get pipelines
     * GET /cogapi/pipelines
     */
    getPipelines: async (
      params: {
        pipeline_name?: string;
        name?: string; // Support name field from table filters
        page?: number;
        limit?: number;
        [key: string]: unknown; // Allow additional filter parameters
      } = {},
    ) => {
      const q = new URLSearchParams();
      // Handle both pipeline_name and name
      const name = params.pipeline_name || params.name || '';
      if (name) q.append('pipeline_name', name);
      // Note: The API doesn't seem to support pagination params based on OpenAPI spec
      // but we'll pass them if the backend adds support later
      if (params.page) q.append('page', params.page.toString());
      if (params.limit) q.append('limit', params.limit.toString());
      return request(`/pipelines${q.toString() ? `?${q.toString()}` : ''}`);
    },

    /**
     * Get pipeline runs
     * GET /cogapi/pipeline/runs/{pipeline_id}
     */
    getPipelineRuns: async (pipeline_id: string) => {
      return request(`/pipeline/runs/${pipeline_id}`);
    },

    /**
     * Delete pipeline runs
     * DELETE /cogapi/pipeline/runs/{pipeline_id}
     */
    deletePipelineRuns: async (pipeline_id: string) => {
      return request(`/pipeline/runs/${pipeline_id}`, 'DELETE');
    },

    /**
     * Get all pipeline runs
     * GET /cogapi/pipelines/runs
     */
    getAllPipelineRuns: async () => {
      return request('/pipelines/runs');
    },

    /**
     * Get pipeline component
     * GET /cogapi/pipelines/component
     */
    getPipelineComponent: async (
      run_id: string,
      run_name: string,
      pipeline_name: string,
    ) => {
      const q = new URLSearchParams();
      q.append('run_id', run_id);
      q.append('run_name', run_name);
      q.append('pipeline_name', pipeline_name);
      return request(`/pipelines/component?${q.toString()}`);
    },

    /**
     * Get pipeline component run
     * GET /cogapi/pipelines/component/run
     */
    getPipelineComponentRun: async (run_id: string, run_name: string) => {
      const q = new URLSearchParams();
      q.append('run_id', run_id);
      q.append('run_name', run_name);
      return request(`/pipelines/component/run?${q.toString()}`);
    },

    /**
     * Get pipeline task
     * GET /cogapi/pipelines/task
     */
    getPipelineTask: async (
      run_id: string,
      run_name: string,
      task_id: string,
    ) => {
      const q = new URLSearchParams();
      q.append('run_id', run_id);
      q.append('run_name', run_name);
      q.append('task_id', task_id);
      return request(`/pipelines/task?${q.toString()}`);
    },

    // ===== COMPONENTS =====
    /**
     * Get components
     * GET /cogapi/components
     */
    getComponents: async () => {
      return request('/components');
    },

    /**
     * Create component
     * POST /cogapi/components
     */
    createComponent: async (data: {
      name: string;
      input_path?: string[];
      output_path?: string[];
      component_file?: string;
    }) => {
      return request('/components', 'POST', data);
    },

    /**
     * Delete component
     * DELETE /cogapi/components/{component_id}
     */
    deleteComponent: async (component_id: string) => {
      return request(`/components/${component_id}`, 'DELETE');
    },

    /**
     * Get pipeline components
     * GET /cogapi/pipeline-components
     */
    getPipelineComponents: async () => {
      return request('/pipeline-components');
    },

    /**
     * Create pipeline component
     * POST /cogapi/pipeline-components
     */
    createPipelineComponent: async (data: {
      name: string;
      pipeline_components?: string;
      input_path?: string[];
      output_path?: string[];
    }) => {
      return request('/pipeline-components', 'POST', data);
    },

    /**
     * Delete pipeline component
     * DELETE /cogapi/pipeline-components/{pipeline_component_id}
     */
    deletePipelineComponent: async (pipeline_component_id: string) => {
      return request(`/pipeline-components/${pipeline_component_id}`, 'DELETE');
    },

    // ===== INFERENCE SERVICE =====
    /**
     * Get inference service logs
     * GET /cogapi/inferenceservice/logs
     */
    getInferenceServiceLogs: async (
      namespace: string,
      inference_service: string,
      container_name: string,
    ) => {
      const q = new URLSearchParams();
      q.append('namespace', namespace);
      q.append('inference_service', inference_service);
      q.append('container_name', container_name);
      return request(`/inferenceservice/logs?${q.toString()}`);
    },

    // ===== PODS =====
    /**
     * Get pod logs
     * GET /cogapi/pod/logs
     */
    getPodLogs: async (
      pod_name: string,
      namespace: string,
      container_name: string,
    ) => {
      const q = new URLSearchParams();
      q.append('pod_name', pod_name);
      q.append('namespace', namespace);
      q.append('container_name', container_name);
      return request(`/pod/logs?${q.toString()}`);
    },

    /**
     * Get pod events
     * GET /cogapi/pod/events
     */
    getPodEvents: async (pod_name: string, namespace: string) => {
      const q = new URLSearchParams();
      q.append('pod_name', pod_name);
      q.append('namespace', namespace);
      return request(`/pod/events?${q.toString()}`);
    },

    /**
     * Get pod definition
     * GET /cogapi/pod/definition
     */
    getPodDefinition: async (pod_name: string, namespace: string) => {
      const q = new URLSearchParams();
      q.append('pod_name', pod_name);
      q.append('namespace', namespace);
      return request(`/pod/definition?${q.toString()}`);
    },

    // ===== DEPLOYMENTS =====
    /**
     * Get deployments
     * GET /cogapi/deployments
     */
    getDeployments: async (namespace: string) => {
      return request(`/deployments?namespace=${encodeURIComponent(namespace)}`);
    },

    // ===== S3 =====
    /**
     * Get S3 image
     * GET /cogapi/s3/get_image
     */
    getS3Image: async (url?: string) => {
      const q = url ? `?url=${encodeURIComponent(url)}` : '';
      return request(`/s3/get_image${q}`);
    },

    // ===== USERS =====
    /**
     * Get users
     * GET /cogapi/users
     */
    getUsers: async () => {
      return request('/users');
    },

    /**
     * Create user
     * POST /cogapi/users
     */
    createUser: async (data: {
      user_level?: number;
      country?: string;
      email: string;
      user_name: string;
      org_id: number;
      full_name: string;
      phone?: string;
      job_title?: string;
    }) => {
      return request('/users', 'POST', data);
    },

    /**
     * Get user by ID
     * GET /cogapi/users/{id}
     */
    getUserById: async (id: number) => {
      return request(`/users/${id}`);
    },

    /**
     * Update user
     * PATCH /cogapi/users/{id}
     */
    updateUser: async (
      id: string,
      data: {
        user_level?: number;
        country?: string;
        email?: string;
        user_name?: string;
        org_id?: number;
        full_name?: string;
        phone?: string;
        job_title?: string;
        updated_at?: string;
      },
    ) => {
      return request(`/users/${id}`, 'PATCH', data);
    },

    /**
     * Delete user
     * DELETE /cogapi/users/{id}
     */
    deleteUser: async (id: number) => {
      return request(`/users/${id}`, 'DELETE');
    },

    // ===== HEALTH =====
    /**
     * Root endpoint
     * GET /cogapi/
     */
    getRoot: async () => {
      return request('/');
    },

    /**
     * Health check
     * GET /cogapi/health
     */
    healthCheck: async () => {
      return request('/health');
    },

    /**
     * Get headers
     * GET /cogapi/headers
     */
    getRequestHeaders: async () => {
      return request('/headers');
    },

    // ===== TABLE DATA SOURCE WRAPPERS =====
    /**
     * Type guard to check if response is successful
     */
    isSuccessResponse: (
      response: unknown,
    ): response is {
      data?: unknown;
      pagination?: unknown;
      message?: string;
      status_code?: number;
    } => {
      return (
        response !== null && typeof response === 'object' && 'data' in response
      );
    },

    /**
     * Wrapper for models table data source
     */
    getModelsForTable: async (params: Record<string, unknown> = {}) => {
      const response = await request(
        `/models${Object.keys(params).length ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`,
      );
      if (response && exports.isSuccessResponse(response)) {
        return {
          data: response.data || [],
          pagination: response.pagination,
          message: response.message,
          status_code: response.status_code,
        };
      }
      return {
        data: [],
        pagination: undefined,
        message: 'Error',
        status_code: 500,
      };
    },

    /**
     * Wrapper for datasets table data source
     */
    getDatasetsForTable: async (params: Record<string, unknown> = {}) => {
      const response = await request(
        `/datasets${Object.keys(params).length ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`,
      );
      if (response && exports.isSuccessResponse(response)) {
        return {
          data: response.data || [],
          pagination: response.pagination,
          message: response.message,
          status_code: response.status_code,
        };
      }
      return {
        data: [],
        pagination: undefined,
        message: 'Error',
        status_code: 500,
      };
    },
  };

  return exports;
};
