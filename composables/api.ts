import {
  apiErrorResponseSchema,
  apiResponseSchema,
} from '~/schemas/response.schema';
import type {
  ModelRecommendParams,
  ModelQueryParams,
  DatasetQueryParams,
  ModelFileUploadParams,
  DatasetFileUploadParams,
  PipelineComponentParams,
  PodParams,
  InferenceServiceParams,
} from '~/types/api.types';

import datasetsData from '@/mocks/get.datasets.json';
import modelsData from '@/mocks/get.models.json';
import runsData from '@/mocks/get.runs.json';
import runsDetailsData from '@/mocks/get.runs.details.json';
import componentsData from '@/mocks/get.training-builder-components.json';
import runsFlowData from '@/mocks/get.runs.flow.json';

/**
 * @fileoverview Cognitive Framework API client
 *
 * This module provides a comprehensive API client for the Cognitive Framework,
 * including models, datasets, validation, pipelines, and user management.
 *
 * @version 2.0
 * @author Cognitive Framework Team
 */

/**
 * Main API composable for Cognitive Framework
 *
 * Provides a comprehensive set of methods for interacting with the Cognitive Framework API,
 * including authentication, request handling, and all available endpoints.
 *
 * @returns {Object} API object with all available methods
 *
 * @example
 * ```typescript
 * const api = useApi();
 * const models = await api.getModels({ name: 'my-model' });
 * ```
 */
export const useApi = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase;
  const apiRuns = config.public.apiRuns;
  const mockEnabled = config.public.mockEnabled;
  const accessTokenKey = 'access_token';
  const token = useLocalStorage(accessTokenKey, null);
  const { setPage, page } = useApp();
  const toaster = useToaster();

  /**
   * Generates appropriate headers for API requests
   *
   * @param {boolean} [isFormData=false] - Whether the request contains form data
   * @returns {Object} Headers object with Content-Type and Authorization
   *
   * @private
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
   * Makes HTTP requests to the API
   *
   * Handles authentication, error handling, and response parsing for all API calls.
   * Automatically manages authorization headers and provides consistent error handling.
   *
   * @param {string} url - The API endpoint URL
   * @param {string} [method='GET'] - HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param {unknown} [body] - Request body data
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.showToast=true] - Whether to show error toasts
   * @returns {Promise<Object|null>} Parsed API response or null on error
   *
   * @throws {Error} Network or parsing errors
   *
   * @private
   */
  const request = async (
    url: string,
    method: string = 'GET',
    body?: unknown,
    options?: { showToast?: boolean },
  ) => {
    console.log('request', url, method, body, options);
    const isFormData = body instanceof FormData;
    console.log('isFormData', isFormData);
    const showToast = options?.showToast ?? true;
    console.log('showToast', showToast);
    console.log('toaster', toaster);
    const isModifyingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      method,
    );
    console.log('isModifyingRequest', isModifyingRequest);
    // Set loading state
    setPage({
      ...page.value,
      isLoading: true,
    });
    console.log('setPage', page.value);
    const opts: RequestInit = {
      method,
      headers: getHeaders(isFormData),
      ...(method !== 'DELETE' &&
        method !== 'GET' && { body: isFormData ? body : JSON.stringify(body) }),
    };
    console.log('opts', opts);
    try {
      console.log('request', `${baseUrl}${url}`, opts);
      const res = await fetch(`${baseUrl}${url}`, opts);
      const data = await res.json();

      if (!res.ok) {
        // Always show error toasts
        switch (res.status) {
          case 401:
            useLocalStorage(accessTokenKey, null);
            token.value = null;
            toaster.show('error', 'unauthorized');
            return null;
          case 403:
            toaster.show('error', 'forbidden');
            return null;
          case 404:
            toaster.show('error', 'not_found');
            return null;
          case 500:
            toaster.show('error', 'server_error');
            return null;
          default:
            toaster.show('error', data.message || 'request_failed');
            return null;
        }
      } else {
        // Show success toast only for modifying requests (POST, PUT, PATCH, DELETE) and if enabled
        if (isModifyingRequest && showToast) {
          const successMessage = data.message || 'operation_completed';
          toaster.show('success', successMessage);
        }
      }

      const result =
        res.status >= 400 && res.status < 600
          ? apiErrorResponseSchema.parse(data)
          : apiResponseSchema.parse(data);
      return result;
    } catch (err) {
      // Always show error toast for network errors
      toaster.show('error', 'connection_error');

      // Return null instead of throwing to prevent app crashes
      return null;
    } finally {
      // Reset loading state
      setPage({
        ...page.value,
        isLoading: false,
      });
    }
  };

  return {
    // ============================================================================
    // MODELS API
    // ============================================================================

    /**
     * Retrieves models based on provided filters
     *
     * Fetches models from the database with optional filtering by name or duration.
     * Supports pagination and sorting options.
     *
     * @param {ModelQueryParams} [params={}] - Query parameters
     * @param {number} [params.id] - Model ID
     * @param {number} [params.last_days] - Duration filter in days to fetch models
     * @param {string} [params.name] - The name of the model to retrieve
     * @param {'asc'|'desc'} [params.sort_order='desc'] - Sort order for last_modified_time
     * @param {number} [params.page] - Page number for pagination
     * @param {number} [params.limit] - Number of items per page
     *
     * @returns {Promise<Object>} Standard response containing list of models
     *
     * @example
     * ```typescript
     * // Get all models
     * const models = await api.getModels();
     *
     * // Get models from last 7 days
     * const recentModels = await api.getModels({ last_days: 7 });
     *
     * // Get specific model by name
     * const model = await api.getModels({ name: 'my-model' });
     *
     * // Get models with pagination
     * const paginatedModels = await api.getModels({ page: 1, limit: 10 });
     * ```
     */
    getModels: async (params: ModelQueryParams = {}) => {
      console.log('getModels', params);
      console.log('mockEnabled', mockEnabled);
      if (mockEnabled) {
        return Promise.resolve(modelsData);
      }
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const res = await request(`/models?${q}`);
      return res;
    },
    /**
     * Registers a new model
     *
     * Creates a new model entry in the database with the provided information.
     *
     * @param {Object} data - Model information to register
     * @param {string} data.name - Model name
     * @param {string} data.type - Model type
     * @param {string} [data.description] - Model description
     *
     * @returns {Promise<Object>} Standard response containing the registered model information
     *
     * @example
     * ```typescript
     * const newModel = await api.postModel({
     *   name: 'my-model',
     *   type: 'classification',
     *   description: 'A new classification model'
     * });
     * ```
     */
    postModel: async (data: unknown) => {
      return request(`/models`, 'POST', data);
    },

    /**
     * Updates an existing model
     *
     * Updates the information of a specified model in the database.
     *
     * @param {number} id - The ID of the model to update
     * @param {Object} data - Updated model information
     * @param {string} [data.name] - Updated model name
     * @param {string} [data.type] - Updated model type
     * @param {string} [data.description] - Updated model description
     *
     * @returns {Promise<Object>} Standard response indicating the model has been updated
     *
     * @example
     * ```typescript
     * const updated = await api.patchModel(123, {
     *   name: 'updated-model-name',
     *   description: 'Updated description'
     * });
     * ```
     */
    patchModel: async (id: number, data: unknown) => {
      return request(`/models/${id}`, 'PATCH', data);
    },

    /**
     * Deletes a model by its ID
     *
     * Removes the specified model from the database.
     *
     * @param {number} id - The ID of the model to delete
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deleteModel(123);
     * ```
     */
    deleteModel: async (id: number) => {
      return request(`/models/${id}`, 'DELETE');
    },
    /**
     * Retrieves model and its associated details by ID
     *
     * Fetches detailed information about a model including its associations with datasets
     * and model files using the model's unique identifier.
     *
     * @param {number} id - The ID of the model to retrieve
     *
     * @returns {Promise<Object>} Standard response containing the model and its associated details
     *
     * @example
     * ```typescript
     * const modelDetails = await api.getModelAssociationsById(123);
     * ```
     */
    getModelAssociationsById: async (id: number) => {
      return request(`/models/${id}/associations`);
    },

    /**
     * Retrieves models and their associated details by name
     *
     * Searches for models by name using partial matching and returns detailed information
     * including associations with datasets and model files.
     *
     * @param {string} name - The name of the model to search for (supports partial matching)
     *
     * @returns {Promise<Object>} Standard response containing the models and their associated details
     *
     * @example
     * ```typescript
     * const models = await api.getModelAssociationsByName('my-model');
     * ```
     */
    getModelAssociationsByName: async (name: string) => {
      return request(`/models/associations?name=${name}`);
    },
    /**
     * Uploads a file to a specific model
     *
     * Associates a file with a specified model. The model is identified by its ID
     * and the file type determines whether it's a model policy file or model file.
     *
     * @param {ModelFileUploadParams} params - File upload parameters
     * @param {number} params.id - The ID of the model
     * @param {File[]} params.files - The files to upload
     * @param {string} params.file_type - File type: "0" for Model Policy File, "1" for Model File
     * @param {string} [params.file_description] - Optional file description
     *
     * @returns {Promise<Object>} Standard response containing details of the uploaded file
     *
     * @example
     * ```typescript
     * const result = await api.postModelFile({
     *   id: 123,
     *   files: [fileObject],
     *   file_type: "1",
     *   file_description: "Main model file"
     * });
     * ```
     */
    postModelFile: async ({
      id,
      files,
      file_type,
      file_description,
    }: ModelFileUploadParams) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('file_type', file_type);
      if (file_description) data.append('file_description', file_description);
      return request(`/models/${id}/file`, 'POST', data);
    },
    /**
     * Gets model file information
     *
     * Retrieves information about model files based on model ID or name.
     *
     * @param {Object} [params={}] - Query parameters
     * @param {number} [params.model_id] - Model ID
     * @param {string} [params.model_name] - Model name
     *
     * @returns {Promise<Object>} Standard response containing model file information
     *
     * @example
     * ```typescript
     * const fileInfo = await api.getModelFile({ model_id: 123 });
     * ```
     */
    getModelFile: async (
      params: { model_id?: number; model_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/models/file?${q}`);
    },
    /**
     * Updates a model file version
     *
     * Updates an existing model file with a new version.
     *
     * @param {Object} params - File update parameters
     * @param {File[]} params.files - New files to upload
     * @param {string} params.model_id - Model ID
     * @param {string} params.file_id - File ID to update
     * @param {string} params.file_description - File description
     *
     * @returns {Promise<Object>} Standard response containing updated file information
     *
     * @example
     * ```typescript
     * const result = await api.putModelFile({
     *   files: [newFile],
     *   model_id: '123',
     *   file_id: '456',
     *   file_description: 'Updated model file'
     * });
     * ```
     */
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
    /**
     * Gets model file details by name and model ID
     *
     * Retrieves detailed information about a specific model file.
     *
     * @param {string} file_name - The name of the file
     * @param {number} model_id - The ID of the model
     *
     * @returns {Promise<Object>} Standard response containing file details
     *
     * @example
     * ```typescript
     * const details = await api.getModelFileDetails('model.pkl', 123);
     * ```
     */
    getModelFileDetails: async (file_name: string, model_id: number) => {
      return request(`/models/file/${file_name}/details?model_id=${model_id}`);
    },

    /**
     * Deletes a model file by ID
     *
     * Removes a specific model file from the system.
     *
     * @param {number} file_id - The ID of the file to delete
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deleteModelFile(456);
     * ```
     */
    deleteModelFile: async (file_id: number) => {
      return request(`/models/file/${file_id}`, 'DELETE');
    },

    /**
     * Gets model URI information
     *
     * Retrieves model information based on its URI.
     *
     * @param {string} uri - The URI of the model
     *
     * @returns {Promise<Object>} Standard response containing model URI information
     *
     * @example
     * ```typescript
     * const uriInfo = await api.getModelUri('s3://bucket/model.pkl');
     * ```
     */
    getModelUri: async (uri: string) => {
      return request(`/models/uri?uri=${uri}`);
    },

    /**
     * Posts model URI information
     *
     * Registers model URI information in the system.
     *
     * @param {Object} data - Model URI data to register
     *
     * @returns {Promise<Object>} Standard response containing registered URI information
     *
     * @example
     * ```typescript
     * const result = await api.postModelUri({
     *   uri: 's3://bucket/model.pkl',
     *   model_id: '123'
     * });
     * ```
     */
    postModelUri: async (data: unknown) => {
      return request(`/models/uri`, 'POST', data);
    },
    /**
     * Saves a model with files
     *
     * Saves a model along with its associated files to the system.
     *
     * @param {Object} params - Model save parameters
     * @param {File[]} params.files - Files to save with the model
     * @param {string} params.model_name - Name of the model
     * @param {string} params.file_type - Type of the files
     * @param {string} params.description - Description of the model
     *
     * @returns {Promise<Object>} Standard response containing saved model information
     *
     * @example
     * ```typescript
     * const result = await api.postModelSave({
     *   files: [modelFile],
     *   model_name: 'my-model',
     *   file_type: '1',
     *   description: 'A new model'
     * });
     * ```
     */
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

    /**
     * Deploys a model to Cogflow
     *
     * Initiates the deployment of a specified model into the Cogflow system.
     *
     * @param {Object} data - Model deployment information
     * @param {string} data.name - Model name
     * @param {string} data.version - Model version
     * @param {string} data.isvc_name - Inference service name
     *
     * @returns {Promise<Object>} Standard response indicating successful deployment
     *
     * @example
     * ```typescript
     * const result = await api.postModelDeploy({
     *   name: 'my-model',
     *   version: '1.0',
     *   isvc_name: 'my-model-service'
     * });
     * ```
     */
    postModelDeploy: async (data: unknown) => {
      return request(`/models/service/deploy`, 'POST', data);
    },

    /**
     * Undeploys a model service
     *
     * Removes the specified inference service from deployment.
     *
     * @param {string} svc_name - The name of the inference service to undeploy
     *
     * @returns {Promise<Object>} Standard response indicating successful undeployment
     *
     * @example
     * ```typescript
     * const result = await api.deleteModelUndeploy('my-model-service');
     * ```
     */
    deleteModelUndeploy: async (svc_name: string) => {
      return request(`/models/service/undeploy?svc_name=${svc_name}`, 'DELETE');
    },
    /**
     * Fetches the best model recommendation based on criteria
     *
     * Returns the best-performing machine learning model based on the model name,
     * classification scores, or both. The system returns the model with the highest
     * average score when multiple classification scores are provided.
     *
     * @param {ModelRecommendParams} [params={}] - Recommendation parameters
     * @param {string} [params.model_name] - The name of the model to filter (e.g., "LR" for Logistic Regression)
     * @param {string[]} [params.classification_score] - List of classification metrics (accuracy_score, f1_score, recall_score, precision_score, etc.)
     *
     * @returns {Promise<Object>} Standard response containing the recommended model with scores
     *
     * @example
     * ```typescript
     * // Get recommendation by model name
     * const recommendation = await api.getModelRecommend({ model_name: 'LR' });
     *
     * // Get recommendation by classification scores
     * const bestModel = await api.getModelRecommend({
     *   classification_score: ['f1_score', 'accuracy_score']
     * });
     *
     * // Get recommendation with both criteria
     * const specificRecommendation = await api.getModelRecommend({
     *   model_name: 'GradientBoosting',
     *   classification_score: ['f1_score']
     * });
     * ```
     */
    getModelRecommend: async (params: ModelRecommendParams = {}) => {
      const q = new URLSearchParams();
      if (params.model_name) q.append('model_name', params.model_name);
      if (params.classification_score) {
        params.classification_score.forEach((score) =>
          q.append('classification_score', score),
        );
      }
      const res = await request(`/models/recommend?${q.toString()}`);
      return res;
    },
    /**
     * Gets model details by ID or name
     *
     * Retrieves detailed model information using either model ID or name.
     *
     * @param {Object} [params={}] - Query parameters
     * @param {number} [params.id] - Model ID
     * @param {string} [params.name] - Model name
     *
     * @returns {Promise<Object|null>} Standard response containing model details or null
     *
     * @example
     * ```typescript
     * const details = await api.getModelDetails({ id: 123 });
     * const detailsByName = await api.getModelDetails({ name: 'my-model' });
     * ```
     */
    getModelDetails: async (params: { id?: number; name?: string } = {}) => {
      if (params.id) {
        return request(`/models/${params.id}/associations`);
      }
      if (params.name) {
        return request(`/models/associations?name=${params.name}`);
      }
      return null;
    },

    /**
     * Gets a model by its ID
     *
     * Retrieves a specific model using its unique identifier.
     *
     * @param {string} id - The ID of the model
     *
     * @returns {Promise<Object>} Standard response containing model information
     *
     * @example
     * ```typescript
     * const model = await api.getModelById('123e4567-e89b-12d3-a456-426614174000');
     * ```
     */
    getModelById: async (id: string) => {
      return request(`/models/${id}`);
    },

    /**
     * Gets model URI by URI string
     *
     * Retrieves model information based on its URI with proper encoding.
     *
     * @param {string} uri - The URI of the model
     *
     * @returns {Promise<Object>} Standard response containing model URI information
     *
     * @example
     * ```typescript
     * const uriInfo = await api.getModelUriByUri('s3://bucket/model.pkl');
     * ```
     */
    getModelUriByUri: async (uri: string) => {
      return request(`/models/uri?uri=${encodeURIComponent(uri)}`);
    },

    /**
     * Posts model URI by model ID
     *
     * Registers a model URI for a specific model.
     *
     * @param {string} id - The ID of the model
     * @param {Object} data - Model URI data to register
     *
     * @returns {Promise<Object>} Standard response containing registered URI information
     *
     * @example
     * ```typescript
     * const result = await api.postModelUriById('123', {
     *   uri: 's3://bucket/model.pkl',
     *   file_type: '1'
     * });
     * ```
     */
    postModelUriById: async (id: string, data: unknown) => {
      return request(`/models/${id}/uri`, 'POST', data);
    },

    /**
     * Gets inference services
     *
     * Fetches inference service details, optionally filtered by service name.
     *
     * @param {string} [isvc_name] - Optional inference service name
     *
     * @returns {Promise<Object>} Standard response containing inference service details
     *
     * @example
     * ```typescript
     * const services = await api.getInferenceServices();
     * const specificService = await api.getInferenceServices('my-service');
     * ```
     */
    getInferenceServices: async (isvc_name?: string) => {
      const params = isvc_name ? `?isvc_name=${isvc_name}` : '';
      return request(`/models/inference-services${params}`);
    },

    /**
     * Gets model file metadata
     *
     * Retrieves metadata for a specific model file.
     *
     * @param {string} id - The ID of the model
     * @param {number} file_id - The ID of the file
     *
     * @returns {Promise<Object>} Standard response containing file metadata
     *
     * @example
     * ```typescript
     * const metadata = await api.getModelFileMetadata('123', 456);
     * ```
     */
    getModelFileMetadata: async (id: string, file_id: number) => {
      return request(`/models/${id}/file/${file_id}`);
    },

    /**
     * Updates a model file by ID
     *
     * Updates an existing model file with new data.
     *
     * @param {string} id - The ID of the model
     * @param {number} file_id - The ID of the file to update
     * @param {FormData} data - New file data
     *
     * @returns {Promise<Object>} Standard response containing updated file information
     *
     * @example
     * ```typescript
     * const formData = new FormData();
     * formData.append('files', newFile);
     * const result = await api.putModelFileById('123', 456, formData);
     * ```
     */
    putModelFileById: async (id: string, file_id: number, data: FormData) => {
      return request(`/models/${id}/file/${file_id}`, 'PUT', data);
    },

    /**
     * Downloads a model file
     *
     * Downloads a specific model file by model ID and file ID.
     *
     * @param {string} id - The ID of the model
     * @param {number} file_id - The ID of the file to download
     *
     * @returns {Promise<Object>} File download response
     *
     * @example
     * ```typescript
     * const file = await api.downloadModelFile('123', 456);
     * ```
     */
    downloadModelFile: async (id: string, file_id: number) => {
      return request(`/models/${id}/file/${file_id}/download`);
    },

    /**
     * Logs a model
     *
     * Logs model information to the system.
     *
     * @param {Object} data - Model log data
     * @param {string} data.model_id - Model ID
     * @param {string} data.model_name - Model name
     * @param {number} data.model_version - Model version
     * @param {string} data.type - Log type
     * @param {string} [data.description] - Optional description
     *
     * @returns {Promise<Object>} Standard response containing logged model information
     *
     * @example
     * ```typescript
     * const result = await api.postModelLog({
     *   model_id: '123',
     *   model_name: 'my-model',
     *   model_version: 1,
     *   type: 'training',
     *   description: 'Model training completed'
     * });
     * ```
     */
    postModelLog: async (data: unknown) => {
      return request(`/models/log`, 'POST', data);
    },
    // ============================================================================
    // DATASETS API
    // ============================================================================

    /**
     * Fetches datasets based on filters
     *
     * Retrieves datasets from the database with optional filtering by name or duration.
     * Supports pagination and various query parameters.
     *
     * @param {DatasetQueryParams} [params={}] - Query parameters
     * @param {string} [params.name] - The name of the dataset to search for
     * @param {number} [params.id] - Dataset ID
     * @param {number} [params.last_days] - The number of days to look back for datasets
     * @param {number} [params.page] - Page number for pagination
     * @param {number} [params.limit] - Number of items per page
     *
     * @returns {Promise<Object>} Standard response containing the list of datasets
     *
     * @example
     * ```typescript
     * // Get all datasets
     * const datasets = await api.getDatasets();
     *
     * // Get datasets from last 30 days
     * const recentDatasets = await api.getDatasets({ last_days: 30 });
     *
     * // Get specific dataset by name
     * const dataset = await api.getDatasets({ name: 'training-data' });
     *
     * // Get datasets with pagination
     * const paginatedDatasets = await api.getDatasets({ page: 1, limit: 10 });
     * ```
     */
    getDatasets: async (params: DatasetQueryParams = {}) => {
      console.log('getDatasets', params);
      console.log('mockEnabled', mockEnabled);
      if (mockEnabled) {
        return Promise.resolve(datasetsData);
      }
      console.log('q');
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      console.log('q', q);
      const res = await request(`/datasets?${q}`);
      console.log('res', res);
      return res;
    },
    /**
     * Updates an existing dataset file
     *
     * Updates an existing dataset by providing its ID, name, optional description,
     * and uploading a new file to replace the existing one.
     *
     * @param {DatasetFileUploadParams} params - Dataset update parameters
     * @param {number} params.id - The ID of the dataset to be updated
     * @param {File[]} params.files - The new file containing the dataset
     * @param {string} params.name - The updated name for the dataset
     * @param {number} params.dataset_type - Dataset type: 0 (train), 1 (inference), or 2 (both)
     * @param {string} [params.description] - Optional description of the dataset
     *
     * @returns {Promise<Object>} Standard response indicating successful update
     *
     * @example
     * ```typescript
     * const result = await api.putDatasetFile({
     *   id: 123,
     *   files: [newFile],
     *   name: 'updated-dataset',
     *   dataset_type: 0,
     *   description: 'Updated training dataset'
     * });
     * ```
     */
    putDatasetFile: async ({
      id,
      files,
      name,
      dataset_type,
      description,
    }: DatasetFileUploadParams) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('id', id.toString());
      data.append('name', name);
      data.append('dataset_type', dataset_type.toString());
      if (description) data.append('description', description);
      return request(`/datasets/file`, 'PUT', data);
    },
    /**
     * Registers a new dataset file
     *
     * Creates a new dataset by uploading a file with metadata.
     *
     * @param {DatasetFileUploadParams} params - Dataset registration parameters
     * @param {File[]} params.files - The file containing the dataset
     * @param {string} params.name - The name of the dataset
     * @param {number} params.dataset_type - Dataset type: 0 (train), 1 (inference), or 2 (both)
     * @param {string} [params.description] - Optional description of the dataset
     *
     * @returns {Promise<Object>} Standard response containing created dataset information
     *
     * @example
     * ```typescript
     * const result = await api.postDatasetFile({
     *   files: [datasetFile],
     *   name: 'training-data',
     *   dataset_type: 0,
     *   description: 'Training dataset for classification'
     * });
     * ```
     */
    postDatasetFile: async ({
      files,
      name,
      dataset_type,
      description,
    }: DatasetFileUploadParams) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      data.append('name', name);
      data.append('dataset_type', dataset_type.toString());
      if (description) data.append('description', description);
      return request(`/datasets/file`, 'POST', data);
    },

    /**
     * Deletes a dataset file
     *
     * Removes a specific dataset from the database using its ID.
     *
     * @param {number} id - The ID of the dataset to delete
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deleteDatasetFile(123);
     * ```
     */
    deleteDatasetFile: async (id: number) => {
      return request(`/datasets/file/${id}`, 'DELETE');
    },
    /**
     * Links a dataset to a model
     *
     * Establishes a relationship between a dataset and a model.
     *
     * @param {number} dataset_id - The ID of the dataset
     * @param {number} model_id - The ID of the model
     *
     * @returns {Promise<Object>} Standard response indicating successful linking
     *
     * @example
     * ```typescript
     * const result = await api.postDatasetModelLink(123, 456);
     * ```
     */
    postDatasetModelLink: async (dataset_id: number, model_id: number) => {
      return request(`/datasets/${dataset_id}/models/${model_id}/link`, 'POST');
    },

    /**
     * Unlinks a dataset from a model
     *
     * Removes the relationship between a dataset and a model.
     *
     * @param {number} dataset_id - The ID of the dataset
     * @param {number} model_id - The ID of the model
     *
     * @returns {Promise<Object>} Standard response indicating successful unlinking
     *
     * @example
     * ```typescript
     * const result = await api.postDatasetModelUnlink(123, 456);
     * ```
     */
    postDatasetModelUnlink: async (dataset_id: number, model_id: number) => {
      return request(
        `/datasets/${dataset_id}/models/${model_id}/unlink`,
        'POST',
      );
    },

    /**
     * Updates a dataset table
     *
     * Updates an existing dataset table in the database.
     *
     * @param {Object} data - Dataset table update data
     *
     * @returns {Promise<Object>} Standard response containing updated table information
     *
     * @example
     * ```typescript
     * const result = await api.putDatasetTable({
     *   table_id: 123,
     *   name: 'updated-table',
     *   description: 'Updated description'
     * });
     * ```
     */
    putDatasetTable: async (data: unknown) => {
      return request(`/datasets/table`, 'PUT', data);
    },

    /**
     * Registers a new dataset table
     *
     * Creates a new dataset table in the database.
     *
     * @param {Object} data - Dataset table registration data
     * @param {string} data.name - Table name
     * @param {string} data.description - Table description
     * @param {string} data.db_url - Database URL
     * @param {string} data.table_name - Name of the table
     * @param {string} data.selected_fields - Selected fields
     * @param {number} data.dataset_type - Dataset type: 0 (train), 1 (inference), or 2 (both)
     *
     * @returns {Promise<Object>} Standard response containing registered table information
     *
     * @example
     * ```typescript
     * const result = await api.postDatasetTable({
     *   name: 'my-table',
     *   description: 'Training data table',
     *   db_url: 'postgresql://user:pass@host:5432/db',
     *   table_name: 'training_data',
     *   selected_fields: 'id,name,label',
     *   dataset_type: 0
     * });
     * ```
     */
    postDatasetTable: async (data: unknown) => {
      return request(`/datasets/table`, 'POST', data);
    },

    /**
     * Gets dataset tables from a database
     *
     * Fetches table details from the specified database URL.
     *
     * @param {string} url - Database URL in format: dialect://username:password@host:port/database
     *
     * @returns {Promise<Object>} Standard response containing list of tables
     *
     * @example
     * ```typescript
     * const tables = await api.getDatasetTables('postgresql://user:pass@host:5432/db');
     * ```
     */
    getDatasetTables: async (url: string) => {
      return request(`/datasets/tables?url=${url}`);
    },
    /**
     * Registers a new dataset broker
     *
     * Creates a new message broker for dataset streaming.
     *
     * @param {Object} data - Broker registration data
     * @param {string} data.name - Broker name
     * @param {string} data.host - Broker host
     * @param {number} data.port - Broker port
     * @param {string} data.username - Broker username
     * @param {string} data.password - Broker password
     *
     * @returns {Promise<Object>} Standard response containing broker information
     *
     * @example
     * ```typescript
     * const result = await api.postDatasetBroker({
     *   name: 'kafka-broker',
     *   host: 'localhost',
     *   port: 9092,
     *   username: 'user',
     *   password: 'pass'
     * });
     * ```
     */
    postDatasetBroker: async (data: unknown) => {
      return request(`/datasets/broker`, 'POST', data);
    },

    /**
     * Deletes a dataset broker by ID
     *
     * Removes a message broker from the system.
     *
     * @param {number} id - The ID of the broker to delete
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deleteDatasetBroker(123);
     * ```
     */
    deleteDatasetBroker: async (id: number) => {
      return request(`/datasets/broker/${id}`, 'DELETE');
    },

    /**
     * Updates a dataset broker
     *
     * Modifies an existing message broker configuration.
     *
     * @param {number} id - The ID of the broker to update
     * @param {Object} data - Updated broker data
     *
     * @returns {Promise<Object>} Standard response containing updated broker information
     *
     * @example
     * ```typescript
     * const result = await api.patchDatasetBroker(123, {
     *   host: 'new-host',
     *   port: 9093
     * });
     * ```
     */
    patchDatasetBroker: async (id: number, data: unknown) => {
      return request(`/datasets/broker/${id}`, 'PATCH', data);
    },

    /**
     * Registers a new dataset topic
     *
     * Creates a new topic for dataset streaming on a specific broker.
     *
     * @param {number} broker_id - The ID of the broker
     * @param {Object} data - Topic registration data
     * @param {string} data.name - Topic name
     * @param {number} data.partitions - Number of partitions
     * @param {number} data.replication_factor - Replication factor
     *
     * @returns {Promise<Object>} Standard response containing topic information
     *
     * @example
     * ```typescript
     * const result = await api.postDatasetTopic(123, {
     *   name: 'sensor-data',
     *   partitions: 3,
     *   replication_factor: 1
     * });
     * ```
     */
    postDatasetTopic: async (broker_id: number, data: unknown) => {
      return request(`/datasets/broker/${broker_id}/topic`, 'POST', data);
    },

    /**
     * Updates a dataset topic
     *
     * Modifies an existing topic configuration.
     *
     * @param {number} id - The ID of the topic to update
     * @param {Object} data - Updated topic data
     *
     * @returns {Promise<Object>} Standard response containing updated topic information
     *
     * @example
     * ```typescript
     * const result = await api.patchDatasetTopic(456, {
     *   partitions: 5
     * });
     * ```
     */
    patchDatasetTopic: async (id: number, data: unknown) => {
      return request(`/datasets/broker/topic/${id}`, 'PATCH', data);
    },

    /**
     * Deletes a dataset topic
     *
     * Removes a topic from the system.
     *
     * @param {number} id - The ID of the topic to delete
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deleteDatasetTopic(456);
     * ```
     */
    deleteDatasetTopic: async (id: number) => {
      return request(`/datasets/topic/${id}`, 'DELETE');
    },

    /**
     * Gets dataset broker details
     *
     * Retrieves information about all registered brokers.
     *
     * @returns {Promise<Object>} Standard response containing broker details
     *
     * @example
     * ```typescript
     * const brokers = await api.getDatasetBrokerDetails();
     * ```
     */
    getDatasetBrokerDetails: async () => {
      return request(`/datasets/broker/details`);
    },

    /**
     * Gets dataset topic details
     *
     * Retrieves information about all registered topics.
     *
     * @returns {Promise<Object>} Standard response containing topic details
     *
     * @example
     * ```typescript
     * const topics = await api.getDatasetTopicDetails();
     * ```
     */
    getDatasetTopicDetails: async () => {
      return request(`/datasets/topic/details`);
    },

    /**
     * Registers dataset message
     *
     * Sends a message to a dataset topic.
     *
     * @param {Object} data - Message data
     * @param {string} data.topic_name - Topic name
     * @param {string} data.message - Message content
     * @param {Object} [data.headers] - Optional message headers
     *
     * @returns {Promise<Object>} Standard response indicating successful message send
     *
     * @example
     * ```typescript
     * const result = await api.postDatasetMessage({
     *   topic_name: 'sensor-data',
     *   message: '{"sensor_id": 1, "value": 25.5}',
     *   headers: { "content-type": "application/json" }
     * });
     * ```
     */
    postDatasetMessage: async (data: unknown) => {
      return request(`/datasets/message`, 'POST', data);
    },

    /**
     * Gets dataset message details
     *
     * Retrieves message information for a specific dataset.
     *
     * @param {number} dataset_id - The ID of the dataset
     *
     * @returns {Promise<Object>} Standard response containing message details
     *
     * @example
     * ```typescript
     * const messages = await api.getDatasetMessageDetails(123);
     * ```
     */
    getDatasetMessageDetails: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}/message/details`);
    },

    /**
     * Gets dataset file details
     *
     * Retrieves file information for a specific dataset.
     *
     * @param {number} dataset_id - The ID of the dataset
     *
     * @returns {Promise<Object>} Standard response containing file details
     *
     * @example
     * ```typescript
     * const files = await api.getDatasetFileDetails(123);
     * ```
     */
    getDatasetFileDetails: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}/file`);
    },

    /**
     * Gets dataset table details
     *
     * Retrieves table information for a specific dataset.
     *
     * @param {number} dataset_id - The ID of the dataset
     *
     * @returns {Promise<Object>} Standard response containing table details
     *
     * @example
     * ```typescript
     * const tables = await api.getDatasetTableDetails(123);
     * ```
     */
    getDatasetTableDetails: async (dataset_id: number) => {
      return request(`/datasets/${dataset_id}/table`);
    },

    /**
     * Gets dataset table records
     *
     * Retrieves records from a dataset table with optional limit.
     *
     * @param {number} dataset_id - The ID of the dataset
     * @param {number} [limit] - Optional limit on number of records
     *
     * @returns {Promise<Object>} Standard response containing table records
     *
     * @example
     * ```typescript
     * const records = await api.getDatasetTableRecords(123, 100);
     * ```
     */
    getDatasetTableRecords: async (dataset_id: number, limit?: number) => {
      const params = limit ? `?limit=${limit}` : '';
      return request(`/datasets/${dataset_id}/table/records${params}`);
    },

    /**
     * Gets dataset topic data
     *
     * Retrieves data from a dataset topic with optional filtering.
     *
     * @param {number} dataset_id - The ID of the dataset
     * @param {number} [no_of_records] - Number of records to retrieve
     * @param {'earliest'|'latest'} [offset_reset] - Offset reset strategy
     *
     * @returns {Promise<Object>} Standard response containing topic data
     *
     * @example
     * ```typescript
     * const data = await api.getDatasetTopicData(123, 50, 'latest');
     * ```
     */
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

    /**
     * Deletes dataset message
     *
     * Removes a specific message from the system.
     *
     * @param {number} id - The ID of the message to delete
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deleteDatasetMessage(789);
     * ```
     */
    deleteDatasetMessage: async (id: number) => {
      return request(`/datasets/message/${id}`, 'DELETE');
    },

    /**
     * Gets dataset by ID
     *
     * Retrieves a specific dataset using its unique identifier.
     *
     * @param {number} id - The ID of the dataset
     *
     * @returns {Promise<Object>} Standard response containing dataset information
     *
     * @example
     * ```typescript
     * const dataset = await api.getDatasetById(123);
     * ```
     */
    getDatasetById: async (id: number) => {
      return request(`/datasets/${id}`);
    },

    /**
     * Gets dataset subject data
     *
     * Retrieves subject-specific data from a dataset with various filtering options.
     *
     * @param {number} dataset_id - The ID of the dataset
     * @param {number} [no_of_records] - Number of records to retrieve
     * @param {'all'|'last'|'new'|'by_start_sequence'|'by_start_time'|'last_per_subject'} [offset_reset] - Offset reset strategy
     *
     * @returns {Promise<Object>} Standard response containing subject data
     *
     * @example
     * ```typescript
     * const data = await api.getDatasetSubjectData(123, 100, 'last_per_subject');
     * ```
     */
    getDatasetSubjectData: async (
      dataset_id: number,
      no_of_records?: number,
      offset_reset?:
        | 'all'
        | 'last'
        | 'new'
        | 'by_start_sequence'
        | 'by_start_time'
        | 'last_per_subject',
    ) => {
      const params = new URLSearchParams();
      if (no_of_records)
        params.append('no_of_records', no_of_records.toString());
      if (offset_reset) params.append('offset_reset', offset_reset);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/datasets/${dataset_id}/subject/data${query}`);
    },

    /**
     * Registers Prometheus dataset
     *
     * Creates a new Prometheus-based dataset for monitoring data.
     *
     * @param {Object} data - Prometheus dataset data
     * @param {string} data.name - Dataset name
     * @param {string} data.prometheus_url - Prometheus server URL
     * @param {string} data.query - Prometheus query
     * @param {string} [data.description] - Optional description
     *
     * @returns {Promise<Object>} Standard response containing registered dataset information
     *
     * @example
     * ```typescript
     * const result = await api.postDatasetPrometheus({
     *   name: 'cpu-metrics',
     *   prometheus_url: 'http://prometheus:9090',
     *   query: 'cpu_usage_percent',
     *   description: 'CPU usage metrics'
     * });
     * ```
     */
    postDatasetPrometheus: async (data: unknown) => {
      return request(`/datasets/prometheus`, 'POST', data);
    },

    /**
     * Gets Prometheus dataset
     *
     * Retrieves a specific Prometheus dataset by ID.
     *
     * @param {number} id - The ID of the Prometheus dataset
     *
     * @returns {Promise<Object>} Standard response containing Prometheus dataset information
     *
     * @example
     * ```typescript
     * const dataset = await api.getDatasetPrometheus(123);
     * ```
     */
    getDatasetPrometheus: async (id: number) => {
      return request(`/datasets/prometheus/${id}`);
    },
    // ============================================================================
    // VALIDATION API
    // ============================================================================

    /**
     * Gets validation metrics for a specific model by ID
     *
     * Retrieves validation metrics associated with a model using its unique identifier.
     *
     * @param {string} model_id - The ID of the model to get metrics for
     *
     * @returns {Promise<Object>} Standard response containing the validation metrics information
     *
     * @example
     * ```typescript
     * const metrics = await api.getValidationMetricsByModelId('123e4567-e89b-12d3-a456-426614174000');
     * ```
     */
    getValidationMetricsByModelId: async (model_id: string) => {
      return request(`/models/${model_id}/validation/metrics`);
    },
    /**
     * Posts validation metrics by model ID
     *
     * Uploads validation metrics for a specific model.
     *
     * @param {string} model_id - The ID of the model
     * @param {Object} data - Validation metrics data
     * @param {number} data.accuracy - Model accuracy score
     * @param {number} data.precision - Model precision score
     * @param {number} data.recall - Model recall score
     * @param {number} data.f1_score - Model F1 score
     * @param {Object} [data.confusion_matrix] - Optional confusion matrix
     *
     * @returns {Promise<Object>} Standard response containing uploaded metrics information
     *
     * @example
     * ```typescript
     * const result = await api.postValidationMetricsByModelId('123', {
     *   accuracy: 0.95,
     *   precision: 0.92,
     *   recall: 0.88,
     *   f1_score: 0.90
     * });
     * ```
     */
    postValidationMetricsByModelId: async (model_id: string, data: unknown) => {
      return request(`/models/${model_id}/validation/metrics`, 'POST', data);
    },

    /**
     * Gets validation artifacts by model ID
     *
     * Retrieves validation artifacts for a specific model.
     *
     * @param {string} model_id - The ID of the model
     *
     * @returns {Promise<Object>} Standard response containing validation artifacts
     *
     * @example
     * ```typescript
     * const artifacts = await api.getValidationArtifactsByModelId('123');
     * ```
     */
    getValidationArtifactsByModelId: async (model_id: string) => {
      return request(`/models/${model_id}/validation/artifacts`);
    },

    /**
     * Posts validation artifacts by model ID
     *
     * Uploads validation artifacts for a specific model.
     *
     * @param {string} model_id - The ID of the model
     * @param {Object} data - Validation artifacts data
     * @param {string} data.artifact_type - Type of artifact (e.g., 'plot', 'report')
     * @param {string} data.artifact_data - Base64 encoded artifact data
     * @param {string} [data.description] - Optional artifact description
     *
     * @returns {Promise<Object>} Standard response containing uploaded artifacts information
     *
     * @example
     * ```typescript
     * const result = await api.postValidationArtifactsByModelId('123', {
     *   artifact_type: 'plot',
     *   artifact_data: 'base64encodeddata...',
     *   description: 'Confusion matrix plot'
     * });
     * ```
     */
    postValidationArtifactsByModelId: async (
      model_id: string,
      data: unknown,
    ) => {
      return request(`/models/${model_id}/validation/artifacts`, 'POST', data);
    },

    /**
     * Gets validation metrics by model name
     *
     * Retrieves validation metrics for a model by its name.
     *
     * @param {string} model_name - The name of the model
     *
     * @returns {Promise<Object>} Standard response containing validation metrics
     *
     * @example
     * ```typescript
     * const metrics = await api.getValidationMetricsByModelName('my-model');
     * ```
     */
    getValidationMetricsByModelName: async (model_name: string) => {
      return request(`/models/validation/metrics?model_name=${model_name}`);
    },

    /**
     * Gets validation artifacts by model name
     *
     * Retrieves validation artifacts for a model by its name.
     *
     * @param {string} model_name - The name of the model
     *
     * @returns {Promise<Object>} Standard response containing validation artifacts
     *
     * @example
     * ```typescript
     * const artifacts = await api.getValidationArtifactsByModelName('my-model');
     * ```
     */
    getValidationArtifactsByModelName: async (model_name: string) => {
      return request(`/models/validation/artifacts?model_name=${model_name}`);
    },

    /**
     * Gets S3 image by URL
     *
     * Downloads an image from S3 storage using its URL.
     *
     * @param {string} url - The S3 URL of the image
     *
     * @returns {Promise<Object>} Image data response
     *
     * @example
     * ```typescript
     * const image = await api.getS3Image('s3://bucket/images/plot.png');
     * ```
     */
    getS3Image: async (url: string) => {
      return request(`/s3/download?url=${encodeURIComponent(url)}`);
    },
    // ============================================================================
    // PIPELINE API
    // ============================================================================

    /**
     * Posts pipeline details
     *
     * Adds pipeline details to the system using the KfpPipelineService.
     *
     * @param {Object} data - Pipeline details to upload
     *
     * @returns {Promise<Object>} JSON response containing the uploaded pipeline details
     *
     * @example
     * ```typescript
     * const pipeline = await api.postPipeline({
     *   name: 'my-pipeline',
     *   description: 'A new pipeline',
     *   // ... other pipeline details
     * });
     * ```
     */
    postPipeline: async (data: unknown) => {
      return request(`/pipeline`, 'POST', data);
    },
    /**
     * Gets pipeline by model ID
     *
     * Retrieves pipeline information for a specific model.
     *
     * @param {number} model_id - The ID of the model
     *
     * @returns {Promise<Object>} Standard response containing pipeline information
     *
     * @example
     * ```typescript
     * const pipeline = await api.getPipelineByModelId(123);
     * ```
     */
    getPipelineByModelId: async (model_id: number) => {
      return request(`/pipeline/${model_id}`);
    },

    /**
     * Gets pipeline runs by pipeline ID
     *
     * Retrieves all runs for a specific pipeline.
     *
     * @param {string} pipeline_id - The ID of the pipeline
     *
     * @returns {Promise<Object>} Standard response containing pipeline runs
     *
     * @example
     * ```typescript
     * const runs = await api.getPipelineRuns('pipeline-123');
     * ```
     */
    getPipelineRuns: async (pipeline_id: string) => {
      return request(`/pipeline/runs/${pipeline_id}`);
    },

    /**
     * Deletes pipeline runs by pipeline ID
     *
     * Removes all runs for a specific pipeline.
     *
     * @param {string} pipeline_id - The ID of the pipeline
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deletePipelineRuns('pipeline-123');
     * ```
     */
    deletePipelineRuns: async (pipeline_id: string) => {
      return request(`/pipeline/runs/${pipeline_id}`, 'DELETE');
    },

    /**
     * Deletes pipeline by pipeline ID
     *
     * Removes a specific pipeline from the system.
     *
     * @param {string} pipeline_id - The ID of the pipeline
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deletePipeline('pipeline-123');
     * ```
     */
    deletePipeline: async (pipeline_id: string) => {
      return request(`/pipeline/${pipeline_id}`, 'DELETE');
    },

    /**
     * Gets pipelines by name
     *
     * Retrieves pipelines filtered by name.
     *
     * @param {string} pipeline_name - The name of the pipeline
     *
     * @returns {Promise<Object>} Standard response containing matching pipelines
     *
     * @example
     * ```typescript
     * const pipelines = await api.getPipelines('my-pipeline');
     * ```
     */
    getPipelines: async (pipeline_name: string) => {
      return request(`/pipelines?pipeline_name=${pipeline_name}`);
    },

    /**
     * Gets inference service logs
     *
     * Retrieves logs from an inference service.
     *
     * @param {InferenceServiceParams} params - Inference service parameters
     * @param {string} params.inference_service_name - Name of the inference service
     * @param {string} [params.namespace] - Kubernetes namespace
     * @param {string} [params.container_name] - Container name
     *
     * @returns {Promise<Object>} Standard response containing service logs
     *
     * @example
     * ```typescript
     * const logs = await api.getInferenceLogs({
     *   inference_service_name: 'my-service',
     *   namespace: 'default',
     *   container_name: 'kserve-container'
     * });
     * ```
     */
    getInferenceLogs: async (params: InferenceServiceParams) => {
      const q = new URLSearchParams(
        params as unknown as Record<string, string>,
      ).toString();
      return request(`/inferenceservice/logs?${q}`);
    },

    /**
     * Gets pipeline components
     *
     * Retrieves pipeline components with optional filtering.
     *
     * @param {PipelineComponentParams} [params={}] - Component query parameters
     * @param {string} [params.pipeline_id] - Pipeline ID
     * @param {string} [params.pipeline_name] - Pipeline name
     * @param {string} [params.pipeline_workflow_name] - Pipeline workflow name
     *
     * @returns {Promise<Object>} Standard response containing pipeline components
     *
     * @example
     * ```typescript
     * const components = await api.getPipelineComponents({
     *   pipeline_name: 'my-pipeline'
     * });
     * ```
     */
    getPipelineComponents: async (params: PipelineComponentParams = {}) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pipelines/component?${q}`);
    },

    /**
     * Gets pipeline component by run
     *
     * Retrieves pipeline components for a specific run.
     *
     * @param {Object} [params={}] - Run query parameters
     * @param {string} [params.run_id] - Run ID
     * @param {string} [params.run_name] - Run name
     *
     * @returns {Promise<Object>} Standard response containing run components
     *
     * @example
     * ```typescript
     * const components = await api.getPipelineComponentByRun({
     *   run_id: 'run-123'
     * });
     * ```
     */
    getPipelineComponentByRun: async (
      params: { run_id?: string; run_name?: string } = {},
    ) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pipelines/component/run?${q}`);
    },

    /**
     * Gets pipeline task
     *
     * Retrieves information about a specific pipeline task.
     *
     * @param {Object} params - Task query parameters
     * @param {string} params.task_id - Task ID
     * @param {string} [params.run_id] - Run ID
     * @param {string} [params.run_name] - Run name
     *
     * @returns {Promise<Object>} Standard response containing task information
     *
     * @example
     * ```typescript
     * const task = await api.getPipelineTask({
     *   task_id: 'task-123',
     *   run_id: 'run-456'
     * });
     * ```
     */
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

    /**
     * Gets pipeline runs list
     *
     * Retrieves a list of pipeline runs with optional filtering and sorting.
     *
     * @param {Object} [params={}] - Query parameters
     * @param {string} [params.run_id] - Run ID to filter by
     * @param {string} [params.run_name] - Run name to filter by
     * @param {string} [params.sort_by] - Attribute to sort by
     * @param {'asc'|'desc'} [params.sort_order='desc'] - Sort order
     *
     * @returns {Promise<Object>} Standard response containing list of pipeline runs
     *
     * @example
     * ```typescript
     * const runs = await api.getPipelineRunsList();
     * const specificRun = await api.getPipelineRunsList({ run_id: 'dbe1d349-c117-46d5-9b6f-62ed8efafb2b' });
     * const sortedRuns = await api.getPipelineRunsList({ sort_by: 'start_time', sort_order: 'asc' });
     * ```
     */
    getPipelineRunsList: async (
      params: {
        run_id?: string;
        run_name?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
      } = {},
    ) => {
      console.log('getPipelineRunsList', params);
      console.log('mockEnabled', mockEnabled);
      if (mockEnabled) {
        return Promise.resolve(runsDetailsData);
      }
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pipelines/runs?${q}`);
    },
    // ============================================================================
    // POD MANAGEMENT API
    // ============================================================================

    /**
     * Gets pod logs
     *
     * Retrieves logs from a Kubernetes pod.
     *
     * @param {PodParams} params - Pod parameters
     * @param {string} params.pod_name - Name of the pod
     * @param {string} [params.namespace] - Kubernetes namespace
     * @param {string} [params.container_name] - Container name
     *
     * @returns {Promise<Object>} Standard response containing pod logs
     *
     * @example
     * ```typescript
     * const logs = await api.getPodLogs({
     *   pod_name: 'my-pod',
     *   namespace: 'default',
     *   container_name: 'main'
     * });
     * ```
     */
    getPodLogs: async (params: PodParams) => {
      const q = new URLSearchParams(
        params as unknown as Record<string, string>,
      ).toString();
      return request(`/pod/logs?${q}`);
    },

    /**
     * Gets pod events
     *
     * Retrieves events for a Kubernetes pod.
     *
     * @param {Object} params - Pod event parameters
     * @param {string} params.pod_name - Name of the pod
     * @param {string} [params.namespace] - Kubernetes namespace
     *
     * @returns {Promise<Object>} Standard response containing pod events
     *
     * @example
     * ```typescript
     * const events = await api.getPodEvents({
     *   pod_name: 'my-pod',
     *   namespace: 'default'
     * });
     * ```
     */
    getPodEvents: async (params: { pod_name: string; namespace?: string }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pod/events?${q}`);
    },

    /**
     * Gets pod definition
     *
     * Retrieves the definition/manifest of a Kubernetes pod.
     *
     * @param {Object} params - Pod definition parameters
     * @param {string} params.pod_name - Name of the pod
     * @param {string} [params.namespace] - Kubernetes namespace
     *
     * @returns {Promise<Object>} Standard response containing pod definition
     *
     * @example
     * ```typescript
     * const definition = await api.getPodDefinition({
     *   pod_name: 'my-pod',
     *   namespace: 'default'
     * });
     * ```
     */
    getPodDefinition: async (params: {
      pod_name: string;
      namespace?: string;
    }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/pod/definition?${q}`);
    },

    /**
     * Gets deployments
     *
     * Retrieves Kubernetes deployments, optionally filtered by namespace.
     *
     * @param {string} [namespace] - Optional Kubernetes namespace
     *
     * @returns {Promise<Object>} Standard response containing deployments
     *
     * @example
     * ```typescript
     * const deployments = await api.getDeployments('default');
     * const allDeployments = await api.getDeployments();
     * ```
     */
    getDeployments: async (namespace?: string) => {
      const params = namespace ? `?namespace=${namespace}` : '';
      return request(`/deployments${params}`);
    },
    // ============================================================================
    // TRAINING BUILDER COMPONENT APIs
    // ============================================================================

    /**
     * Registers a component by uploading its YAML file
     *
     * Uploads a YAML file containing component definitions to register it in the system.
     *
     * @param {FormData} data - Form data containing the YAML file and optional metadata
     * @param {File} data.yaml_file - The uploaded YAML file
     * @param {string} [data.category] - The category of the component
     * @param {string} [data.creator] - The creator of the component
     *
     * @returns {Promise<Object>} Standard response indicating success or failure
     *
     * @example
     * ```typescript
     * const formData = new FormData();
     * formData.append('yaml_file', yamlFile);
     * formData.append('category', 'preprocessing');
     * formData.append('creator', 'user@example.com');
     *
     * const result = await api.postTrainingBuilderComponentFile(formData);
     * ```
     */
    postTrainingBuilderComponentFile: async (data: FormData) => {
      return request(`/training-builder-components/file`, 'POST', data);
    },
    /**
     * Gets training builder components
     *
     * Retrieves all available training builder components.
     *
     * @returns {Promise<Object>} Standard response containing training builder components
     *
     * @example
     * ```typescript
     * const components = await api.getTrainingBuilderComponents();
     * const components = await api.getTrainingBuilderComponents({ limit: '10' });
     * ```
     */
    getTrainingBuilderComponents: async (params: { limit: string }) => {
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      if (mockEnabled) {
        return Promise.resolve(componentsData);
      }
      return request(`/training-builder-components`);
    },

    /**
     * Creates training builder component
     *
     * Creates a new training builder component.
     *
     * @param {Object} data - Component creation data
     * @param {string} data.name - Component name
     * @param {string} data.type - Component type
     * @param {string} data.description - Component description
     * @param {Object} data.config - Component configuration
     *
     * @returns {Promise<Object>} Standard response containing created component information
     *
     * @example
     * ```typescript
     * const result = await api.postTrainingBuilderComponent({
     *   name: 'data-preprocessor',
     *   type: 'preprocessing',
     *   description: 'Data preprocessing component',
     *   config: { method: 'normalization' }
     * });
     * ```
     */
    postTrainingBuilderComponent: async (data: unknown) => {
      return request(`/training-builder-components`, 'POST', data);
    },

    /**
     * Deletes training builder component
     *
     * Removes a training builder component from the system.
     *
     * @param {number} component_id - The ID of the component to delete
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deleteTrainingBuilderComponent(123);
     * ```
     */
    deleteTrainingBuilderComponent: async (component_id: number) => {
      return request(`/training-builder-components/${component_id}`, 'DELETE');
    },

    // ============================================================================
    // TRAINING BUILDER PIPELINE COMPONENT APIs
    // ============================================================================

    /**
     * Gets training builder pipeline components
     *
     * Retrieves all available training builder pipeline components.
     *
     * @returns {Promise<Object>} Standard response containing pipeline components
     *
     * @example
     * ```typescript
     * const components = await api.getTrainingBuilderPipelineComponents();
     * ```
     */
    getTrainingBuilderPipelineComponents: async () => {
      return request(`/training-builder-pipeline-components`);
    },

    /**
     * Creates training builder pipeline component
     *
     * Creates a new training builder pipeline component.
     *
     * @param {Object} data - Pipeline component creation data
     * @param {string} data.name - Component name
     * @param {string} data.pipeline_id - Pipeline ID
     * @param {string} data.component_type - Component type
     * @param {Object} data.config - Component configuration
     *
     * @returns {Promise<Object>} Standard response containing created pipeline component information
     *
     * @example
     * ```typescript
     * const result = await api.postTrainingBuilderPipelineComponent({
     *   name: 'pipeline-preprocessor',
     *   pipeline_id: 'pipeline-123',
     *   component_type: 'preprocessing',
     *   config: { method: 'scaling' }
     * });
     * ```
     */
    postTrainingBuilderPipelineComponent: async (data: unknown) => {
      return request(`/training-builder-pipeline-components`, 'POST', data, {
        showToast: true,
      });
    },

    /**
     * Deletes training builder pipeline component
     *
     * Removes a training builder pipeline component from the system.
     *
     * @param {number} pipeline_component_id - The ID of the pipeline component to delete
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deleteTrainingBuilderPipelineComponent(456);
     * ```
     */
    deleteTrainingBuilderPipelineComponent: async (
      pipeline_component_id: number,
    ) => {
      return request(
        `/training-builder-pipeline-components/${pipeline_component_id}`,
        'DELETE',
      );
    },
    // ============================================================================
    // USERS API
    // ============================================================================

    /**
     * Fetches all users
     *
     * Retrieves a list of all registered users in the system.
     *
     * @returns {Promise<Object>} Standard response containing list of users
     *
     * @example
     * ```typescript
     * const users = await api.getUsers();
     * ```
     */
    getUsers: async () => {
      return request(`/users`);
    },
    /**
     * Creates a new user
     *
     * Registers a new user in the system.
     *
     * @param {Object} data - User creation data
     * @param {string} data.username - Username
     * @param {string} data.email - User email
     * @param {string} data.password - User password
     * @param {string} [data.first_name] - Optional first name
     * @param {string} [data.last_name] - Optional last name
     * @param {string} [data.role] - Optional user role
     *
     * @returns {Promise<Object>} Standard response containing created user information
     *
     * @example
     * ```typescript
     * const result = await api.postUser({
     *   username: 'john_doe',
     *   email: 'john@example.com',
     *   password: 'secure_password',
     *   first_name: 'John',
     *   last_name: 'Doe',
     *   role: 'user'
     * });
     * ```
     */
    postUser: async (data: unknown) => {
      return request(`/users`, 'POST', data);
    },

    /**
     * Gets user by ID
     *
     * Retrieves a specific user using their unique identifier.
     *
     * @param {number} id - The ID of the user
     *
     * @returns {Promise<Object>} Standard response containing user information
     *
     * @example
     * ```typescript
     * const user = await api.getUser(123);
     * ```
     */
    getUser: async (id: number) => {
      return request(`/users/${id}`);
    },

    /**
     * Updates user by ID
     *
     * Modifies an existing user's information.
     *
     * @param {number} id - The ID of the user to update
     * @param {Object} data - Updated user data
     * @param {string} [data.email] - Updated email
     * @param {string} [data.first_name] - Updated first name
     * @param {string} [data.last_name] - Updated last name
     * @param {string} [data.role] - Updated role
     *
     * @returns {Promise<Object>} Standard response containing updated user information
     *
     * @example
     * ```typescript
     * const result = await api.patchUser(123, {
     *   email: 'newemail@example.com',
     *   first_name: 'Johnny'
     * });
     * ```
     */
    patchUser: async (id: number, data: unknown) => {
      return request(`/users/${id}`, 'PATCH', data);
    },

    /**
     * Deletes user by ID
     *
     * Removes a user from the system.
     *
     * @param {number} id - The ID of the user to delete
     *
     * @returns {Promise<void>} No content response on successful deletion
     *
     * @example
     * ```typescript
     * await api.deleteUser(123);
     * ```
     */
    deleteUser: async (id: number) => {
      return request(`/users/${id}`, 'DELETE');
    },
    // ============================================================================
    // HEALTH CHECK & HOME
    // ============================================================================

    /**
     * Gets the home page
     *
     * Returns the home page content from the API.
     *
     * @returns {Promise<Object>} Home page response
     *
     * @example
     * ```typescript
     * const home = await api.getHome();
     * ```
     */
    getHome: async () => {
      return request(`/`);
    },

    /**
     * Performs a health check
     *
     * Checks the health status of the API server.
     *
     * @returns {Promise<Object>} Health check response
     *
     * @example
     * ```typescript
     * const health = await api.getHealth();
     * ```
     */
    getHealth: async () => {
      return request(`/health`);
    },

    /**
     * Gets request headers
     *
     * Retrieves the headers from the current request.
     *
     * @returns {Promise<Object>} Headers response
     *
     * @example
     * ```typescript
     * const headers = await api.getHeaders();
     * ```
     */
    getHeaders: async () => {
      return request(`/headers`);
    },

    /**
     * Gets pipeline run flow data by run ID
     *
     * Retrieves flow data for a specific pipeline run using the external API.
     *
     * @param {string} id - The run ID
     *
     * @returns {Promise<Object>} Standard response containing pipeline run flow data
     *
     * @example
     * ```typescript
     * const flowData = await api.getPipelineRunFlow('75011b49-1bd1-469a-ae63-38a7d26f1a7f');
     * ```
     */
    getPipelineRunFlow: async (id: string) => {
      if (mockEnabled) {
        return Promise.resolve(runsFlowData);
      }

      const url = `${apiRuns}/runs/${id}`;
      const headers = getHeaders();

      try {
        const response = await fetch(url, { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return data;
      } catch (error) {
        console.error('Error fetching pipeline run flow:', error);
        throw error;
      }
    },
  };
};
