import {
  apiErrorResponseSchema,
  apiResponseSchema,
} from '~/schemas/response.schema';

/**
 * Mock API network delay in milliseconds
 * Simulates realistic API response time for testing loading states
 * Set to 0 to disable delay
 */
const MOCK_API_DELAY_MS = 2;

export const useMock = () => {
  const { t } = useI18n();
  const config = useRuntimeConfig();

  return useState('mock', () => {
    return {
      enabled: config.public.mockEnabled || false,
      components: [
        {
          id: 1,
          name: 'Component 1',
        },
      ],
      stat: {
        total: {
          key: 'total',
          value: 236,
          icon: 'lucide:table-2',
          label: t('stat.total'),
          color: 'primary',
        },
        files: {
          key: 'files',
          value: 221,
          icon: 'lucide:table',
          label: t('stat.files'),
          color: 'text-blue-500',
        },
        tables: {
          key: 'tables',
          value: 13,
          icon: 'lucide:database',
          label: t('stat.tables'),
          color: 'text-violet-500',
        },
        streams: {
          key: 'streams',
          value: 2,
          icon: 'lucide:circle-dot',
          label: t('stat.streams'),
          color: 'text-green-500',
        },
      },

      datasets: [
        {
          id: 1,
          dataset_name: 'Customer Analytics Dataset',
          description: 'Comprehensive customer behavior and analytics data',
          data_source_type: 'file',
          train_and_inference_type: 'supervised',
          created_at: '2024-01-15T10:30:00.000Z',
          last_modified_time: '2024-08-13T14:30:00.000Z',
          register_date_time: '2024-01-15T10:30:00.000Z',
          user_id: 1,
        },
        {
          id: 2,
          dataset_name: 'Sales Forecast Data',
          description: 'Historical sales data for forecasting models',
          data_source_type: 'database',
          train_and_inference_type: 'time_series',
          created_at: '2024-02-20T14:20:00.000Z',
          last_modified_time: '2024-08-10T16:45:00.000Z',
          register_date_time: '2024-02-20T14:20:00.000Z',
          user_id: 2,
        },
        {
          id: 3,
          dataset_name: 'Image Classification Dataset',
          description: 'Collection of labeled images for computer vision tasks',
          data_source_type: 'stream',
          train_and_inference_type: 'unsupervised',
          created_at: '2024-03-10T09:15:00.000Z',
          last_modified_time: '2024-08-05T11:20:00.000Z',
          register_date_time: '2024-03-10T09:15:00.000Z',
          user_id: 1,
        },
        {
          id: 4,
          dataset_name: 'IoT Sensor Data',
          description: 'Real-time sensor data from IoT devices',
          data_source_type: 'stream',
          train_and_inference_type: 'reinforcement',
          created_at: '2024-04-05T16:45:00.000Z',
          last_modified_time: '2024-08-12T13:10:00.000Z',
          register_date_time: '2024-04-05T16:45:00.000Z',
          user_id: 2,
        },
        {
          id: 5,
          dataset_name: 'Text Analysis Corpus',
          description: 'Large corpus of text data for NLP tasks',
          data_source_type: 'file',
          train_and_inference_type: 'supervised',
          created_at: '2024-05-22T12:30:00.000Z',
          last_modified_time: '2024-08-08T10:55:00.000Z',
          register_date_time: '2024-05-22T12:30:00.000Z',
          user_id: 1,
        },
      ],

      models: [
        {
          id: 1,
          name: 'Customer Segmentation Model',
          version: 'v1.2.3',
          type: 'classification',
          description: 'ML model for customer segmentation and targeting',
          last_modified_time: '2024-08-13T14:30:00.000Z',
          register_date: '2024-01-15T10:30:00.000Z',
          register_date_time: '2024-01-15T10:30:00.000Z',
          data_source_type: 'file',
          train_and_inference_type: 'supervised',
          user_id: 1,
        },
        {
          id: 2,
          name: 'Sales Prediction Model',
          version: 'v2.1.0',
          type: 'regression',
          description: 'Time series forecasting model for sales prediction',
          last_modified_time: '2024-08-10T16:45:00.000Z',
          register_date: '2024-02-20T14:20:00.000Z',
          register_date_time: '2024-02-20T14:20:00.000Z',
          data_source_type: 'database',
          train_and_inference_type: 'time_series',
          user_id: 2,
        },
        {
          id: 3,
          name: 'Image Classifier CNN',
          version: 'v3.0.1',
          type: 'deep_learning',
          description: 'Convolutional neural network for image classification',
          last_modified_time: '2024-08-05T11:20:00.000Z',
          register_date: '2024-03-10T09:15:00.000Z',
          register_date_time: '2024-03-10T09:15:00.000Z',
          data_source_type: 'stream',
          train_and_inference_type: 'unsupervised',
          user_id: 1,
        },
        {
          id: 4,
          name: 'Anomaly Detection System',
          version: 'v1.5.2',
          type: 'anomaly_detection',
          description: 'Real-time anomaly detection for IoT sensor data',
          last_modified_time: '2024-08-12T13:10:00.000Z',
          register_date: '2024-04-05T16:45:00.000Z',
          register_date_time: '2024-04-05T16:45:00.000Z',
          data_source_type: 'stream',
          train_and_inference_type: 'reinforcement',
          user_id: 2,
        },
        {
          id: 5,
          name: 'NLP Sentiment Analyzer',
          version: 'v2.3.1',
          type: 'nlp',
          description:
            'Natural language processing model for sentiment analysis',
          last_modified_time: '2024-08-08T10:55:00.000Z',
          register_date: '2024-05-22T12:30:00.000Z',
          register_date_time: '2024-05-22T12:30:00.000Z',
          data_source_type: 'file',
          train_and_inference_type: 'supervised',
          user_id: 1,
        },
      ],

      pipelineRuns: [
        {
          run_id: 'pipeline-001',
          run_name: 'Customer Data Processing Pipeline',
          start_time: '2024-08-13T08:00:00.000Z',
          end_time: '2024-08-13T09:30:00.000Z',
          status: 'SUCCEEDED',
          duration: '1h 30m',
          experiment_id: 'exp-001',
          created_on: '2024-08-13T08:00:00.000Z',
          started_on: '2024-08-13T08:05:00.000Z',
          created_by: 'john.doe',
        },
        {
          run_id: 'pipeline-002',
          run_name: 'Sales Model Training Pipeline',
          start_time: '2024-08-13T10:00:00.000Z',
          end_time: null,
          status: 'RUNNING',
          duration: null,
          experiment_id: 'exp-002',
          created_on: '2024-08-13T10:00:00.000Z',
          started_on: '2024-08-13T10:02:00.000Z',
          created_by: 'jane.smith',
        },
        {
          run_id: 'pipeline-003',
          run_name: 'Image Processing Pipeline',
          start_time: '2024-08-12T14:30:00.000Z',
          end_time: '2024-08-12T16:45:00.000Z',
          status: 'FAILED',
          duration: '2h 15m',
          experiment_id: 'exp-003',
          created_on: '2024-08-12T14:30:00.000Z',
          started_on: '2024-08-12T14:32:00.000Z',
          created_by: 'john.doe',
        },
        {
          run_id: 'pipeline-004',
          run_name: 'Data Quality Check Pipeline',
          start_time: '2024-08-12T09:00:00.000Z',
          end_time: '2024-08-12T09:45:00.000Z',
          status: 'SUCCEEDED',
          duration: '45m',
          experiment_id: 'exp-004',
          created_on: '2024-08-12T09:00:00.000Z',
          started_on: '2024-08-12T09:01:00.000Z',
          created_by: 'jane.smith',
        },
        {
          run_id: 'pipeline-005',
          run_name: 'Model Validation Pipeline',
          start_time: '2024-08-11T16:00:00.000Z',
          end_time: '2024-08-11T18:30:00.000Z',
          status: 'SUCCEEDED',
          duration: '2h 30m',
          experiment_id: 'exp-005',
          created_on: '2024-08-11T16:00:00.000Z',
          started_on: '2024-08-11T16:03:00.000Z',
          created_by: 'john.doe',
        },
      ],

      data: [
        {
          id: 1,
          name: 'Alice',
          description: 'Alice is a software engineer',
          status: 'active',
          type: 'stream',
          last_update: '2021-09-01',
        },
        {
          id: 2,
          name: 'Bob',
          description: 'Bob is a data scientist',
          status: 'inactive',
          type: 'file',
          last_update: '2021-09-02',
        },
        {
          id: 3,
          name: 'Charlie',
          description: 'Charlie is a machine learning engineer',
          status: 'active',
          type: 'database',
          last_update: '2021-09-03',
        },
        {
          id: 4,
          name: 'David',
          description: 'David is a data engineer',
          status: 'inactive',
          type: 'stream',
          last_update: '2021-09-04',
        },
        {
          id: 5,
          name: 'Eve',
          description: 'Eve is a data analyst',
          status: 'active',
          type: 'file',
          last_update: '2021-09-05',
        },
      ],

      trainingComponents: [
        {
          id: '55455462-0957-4d57-9847-9cc36dd07068',
          name: 'FedSCVI server',
          input_path: [
            {
              name: 'number_of_iterations',
              type: 'Integer',
              description: 'Number of federated learning rounds',
            },
            {
              name: 'server_address',
              type: 'String',
              description: 'Server address (e.g., "0.0.0.0:8080")',
            },
            {
              name: 'experiment_name',
              type: 'String',
              description: 'Cogflow experiment name',
              default: 'FedSCVI',
              optional: true,
            },
            {
              name: 'n_layers',
              type: 'Integer',
              description: 'Number of layers in scVI model',
              default: '2',
              optional: true,
            },
            {
              name: 'dropout_rate',
              type: 'Float',
              description: 'Dropout rate for scVI model',
              default: '0.2',
              optional: true,
            },
            {
              name: 'min_clients',
              type: 'Integer',
              description: 'Minimum number of clients to wait for',
              default: '2',
              optional: true,
            },
            {
              name: 'fraction_fit',
              type: 'Float',
              description:
                'Fraction of clients to use for training (default: 1.0 = all)',
              default: '1.0',
              optional: true,
            },
            {
              name: 'fraction_evaluate',
              type: 'Float',
              description:
                'Fraction of clients to use for evaluation (default: 1.0 = all)',
              default: '1.0',
              optional: true,
            },
          ],
          output_path: [
            {
              name: 'Output',
              type: 'JsonObject',
            },
          ],
          component_file: 's3://components/FedSCVI_server.yaml',
          category: 'federated server',
          creator: 'admin@hiro.com',
        },
        {
          id: '933cd6ed-40ff-4f38-860e-37a532b9a67c',
          name: 'cogflow_refactor',
          input_path: [
            {
              name: 'number_of_iterations',
              type: 'Integer',
              description: 'Number of federated learning rounds',
            },
            {
              name: 'server_address',
              type: 'String',
              description: 'Server address (e.g., "0.0.0.0:8080")',
            },
            {
              name: 'experiment_name',
              type: 'String',
              description: 'Cogflow experiment name',
              default: 'FedSCVI',
              optional: true,
            },
            {
              name: 'n_layers',
              type: 'Integer',
              description: 'Number of layers in scVI model',
              default: '2',
              optional: true,
            },
            {
              name: 'dropout_rate',
              type: 'Float',
              description: 'Dropout rate for scVI model',
              default: '0.2',
              optional: true,
            },
            {
              name: 'min_clients',
              type: 'Integer',
              description: 'Minimum number of clients to wait for',
              default: '2',
              optional: true,
            },
            {
              name: 'fraction_fit',
              type: 'Float',
              description:
                'Fraction of clients to use for training (default: 1.0 = all)',
              default: '1.0',
              optional: true,
            },
            {
              name: 'fraction_evaluate',
              type: 'Float',
              description:
                'Fraction of clients to use for evaluation (default: 1.0 = all)',
              default: '1.0',
              optional: true,
            },
          ],
          output_path: [
            {
              name: 'Output',
              type: 'JsonObject',
            },
          ],
          component_file: 's3://components/cogflow_refactor.yaml',
          category: 'cogflow-refactor',
          creator: 'admin@hiro.com',
        },
        {
          id: '8fd340c3-960d-4be5-81be-8f4ca40698a1',
          name: 'FedSCVI client',
          input_path: [
            {
              name: 'local_data_connector',
              type: 'String',
            },
            {
              name: 'server_address',
              type: 'String',
              description: 'Server address (e.g., "localhost:8080")',
            },
            {
              name: 'num_local_epochs',
              type: 'Integer',
              description: 'Number of local training epochs per round',
            },
            {
              name: 'validation_split',
              type: 'Float',
              description: 'Fraction of data to use for validation',
            },
            {
              name: 'n_layers',
              type: 'Integer',
              description: 'Number of layers in scVI model',
            },
            {
              name: 'dropout_rate',
              type: 'Float',
              description: 'Dropout rate for scVI model',
            },
          ],
          output_path: [
            {
              name: 'Output',
              type: 'JsonObject',
            },
          ],
          component_file: 's3://components/FedSCVI_client.yaml',
          category: 'federated client',
          creator: 'admin@hiro.com',
        },
      ],

      user: {
        id: 1,
        email: 'john.doe@company.com',
        full_name: 'John Doe',
        user_name: 'john.doe',
        org_id: 1,
        country: 'United States',
        phone: '+1-555-0123',
        job_title: 'System Administrator',
        user_level: 5,
        password_updated_at: '2024-01-15T10:30:00.000Z',
        created_at: '2023-06-01T09:00:00.000Z',
        updated_at: '2024-08-13T14:30:00.000Z',
        avatar_url: 'https://github.com/shadcn.png',
      },

      users: [
        {
          id: 1,
          email: 'john.doe@company.com',
          full_name: 'John Doe',
          user_name: 'john.doe',
          org_id: 1,
          country: 'United States',
          phone: '+1-555-0123',
          job_title: 'System Administrator',
          user_level: 5,
          password_updated_at: '2024-01-15T10:30:00.000Z',
          created_at: '2023-06-01T09:00:00.000Z',
          updated_at: '2024-08-13T14:30:00.000Z',
          avatar_url: 'https://github.com/shadcn.png',
        },
        {
          id: 2,
          email: 'jane.smith@company.com',
          full_name: 'Jane Smith',
          user_name: 'jane.smith',
          org_id: 1,
          country: 'Canada',
          phone: '+1-555-0124',
          job_title: 'Data Scientist',
          user_level: 4,
          password_updated_at: '2024-02-20T14:20:00.000Z',
          created_at: '2023-07-15T10:30:00.000Z',
          updated_at: '2024-08-10T16:45:00.000Z',
          avatar_url: 'https://github.com/jane.png',
        },
      ],
    };
  });
};

export const useApiWithMock = () => {
  const mock = useMock();

  // Prevent infinite recursion by directly accessing real API
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase;
  const accessTokenKey = 'access_token';
  const token = useLocalStorage(accessTokenKey, null);
  const { setPage, page } = useApp();

  // Simulate network delay for mock data
  const mockDelay = async (ms: number = MOCK_API_DELAY_MS) => {
    // Set loading state to true before delay
    setPage({
      ...page.value,
      isLoading: true,
    });

    await new Promise((resolve) => setTimeout(resolve, ms));

    // Set loading state to false after delay
    setPage({
      ...page.value,
      isLoading: false,
    });
  };

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

  const request = async (
    url: string,
    method: string = 'GET',
    body?: unknown,
    options?: { showToast?: boolean; successMessage?: string },
  ) => {
    const isFormData = body instanceof FormData;
    const showToast = options?.showToast;
    const customSuccessMessage = options?.successMessage;
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
      } else {
        const successMessage =
          customSuccessMessage || data.message || 'operation_completed';
        if (showToast) toaster.show('success', successMessage);
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
    getDatasets: async (params = {}) => {
      if (mock.value.enabled) {
        await mockDelay();
        // Import data from JSON file
        const datasetsJson = await import('~/mocks/get.datasets.json');

        let filteredData = [...datasetsJson.data];

        // Apply search filters
        const searchParams = params as Record<string, string>;

        // Filter by ID
        if (searchParams.id) {
          filteredData = filteredData.filter((dataset) =>
            dataset.id.toLowerCase().includes(searchParams.id.toLowerCase()),
          );
        }

        // Filter by name or dataset_name
        if (searchParams.name) {
          filteredData = filteredData.filter((dataset) =>
            dataset.dataset_name
              .toLowerCase()
              .includes(searchParams.name.toLowerCase()),
          );
        }

        if (searchParams.dataset_name) {
          filteredData = filteredData.filter((dataset) =>
            dataset.dataset_name
              .toLowerCase()
              .includes(searchParams.dataset_name.toLowerCase()),
          );
        }

        // Handle pagination
        const page = parseInt(searchParams.page || '1');
        const limit = parseInt(searchParams.limit || '10');
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return Promise.resolve({
          status_code: datasetsJson.status_code,
          message: datasetsJson.message,
          data: paginatedData,
          pagination: {
            total: filteredData.length,
            page: page,
            limit: limit,
            total_pages: Math.ceil(filteredData.length / limit),
          },
        });
      }
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/datasets?${q}`);
    },

    getModels: async (params = {}) => {
      if (mock.value.enabled) {
        await mockDelay();
        const modelsJson = await import('~/mocks/get.models.json');

        let filteredData = [...modelsJson.data];

        // Apply search filters
        const searchParams = params as Record<string, string>;

        // Filter by ID
        if (searchParams.id) {
          filteredData = filteredData.filter((model) =>
            model.id.toLowerCase().includes(searchParams.id.toLowerCase()),
          );
        }

        // Filter by name
        if (searchParams.name) {
          filteredData = filteredData.filter((model) =>
            model.name.toLowerCase().includes(searchParams.name.toLowerCase()),
          );
        }

        // Handle pagination
        const page = parseInt(searchParams.page || '1');
        const limit = parseInt(searchParams.limit || '10');
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return Promise.resolve({
          status_code: modelsJson.status_code,
          message: modelsJson.message,
          data: paginatedData,
          pagination: {
            total: filteredData.length,
            page: page,
            limit: limit,
            total_pages: Math.ceil(filteredData.length / limit),
          },
        });
      }
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/models?${q}`);
    },

    getModelsServing: async (params: Record<string, unknown> = {}) => {
      if (mock.value.enabled) {
        await mockDelay();
        const modelsServingJson = await import(
          '~/mocks/get.models-serving.json'
        );

        const searchParams = params as Record<string, string>;
        const page = parseInt(searchParams.page || '1');
        const limit = parseInt(searchParams.limit || '10');

        let filteredData = [...modelsServingJson.data];

        // Apply search filter
        if (searchParams.search) {
          const search = searchParams.search.toLowerCase();
          filteredData = filteredData.filter(
            (item) =>
              item.isvc_name?.toLowerCase().includes(search) ||
              item.model_name?.toLowerCase().includes(search) ||
              item.status?.toLowerCase().includes(search),
          );
        }

        // Apply status filter
        if (searchParams.status) {
          filteredData = filteredData.filter(
            (item) =>
              item.status?.toLowerCase() === searchParams.status.toLowerCase(),
          );
        }

        // Apply sort
        const sortBy = searchParams.sort_by || 'creation_timestamp';
        const sortOrder = (searchParams.sort_order || 'desc') as 'asc' | 'desc';
        if (sortBy === 'creation_timestamp') {
          filteredData = filteredData.sort((a, b) => {
            const dateA = new Date(a.creation_timestamp || 0).getTime();
            const dateB = new Date(b.creation_timestamp || 0).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
        }

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return Promise.resolve({
          status_code: modelsServingJson.status_code,
          message: modelsServingJson.message,
          data: paginatedData,
          pagination: {
            total_items: filteredData.length,
            page: page,
            limit: limit,
            total_pages: Math.ceil(filteredData.length / limit),
          },
        });
      }
      const q = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      return request(`/models-serving${q ? `?${q}` : ''}`);
    },

    postModelServing: async (data: {
      model_id: string;
      isvc_name: string;
      model_name: string;
      model_version: string;
      dataset_id?: string;
      transformer_image?: string;
      transformer_parameters?: unknown;
      protocol_version: string;
      model_format: string;
      artifact_path?: string;
    }) => {
      if (mock.value.enabled) {
        await mockDelay();
        return Promise.resolve({
          status_code: 201,
          message: 'Model serving created successfully',
          data,
        });
      }
      return request(`/models-serving`, 'POST', data, {
        showToast: true,
        successMessage: 'Model serving created successfully',
      });
    },

    patchModelServing: async (
      data: {
        isvc_name: string;
        canary_traffic_percent: number;
      },
      _options?: { showToast?: boolean; successMessage?: string },
    ) => {
      if (mock.value.enabled) {
        await mockDelay();
        return Promise.resolve({
          status_code: 200,
          message: 'Model serving updated successfully',
          data: data,
        });
      }
      return request(`/models-serving`, 'PATCH', data);
    },

    getModelById: async (id: string) => {
      if (mock.value.enabled) {
        await mockDelay();
        const detailsJson = await import('~/mocks/get.models.details.json');
        return Promise.resolve(
          detailsJson as {
            status_code: number;
            message: string;
            data: unknown;
          },
        );
      }
      return request(`/models/${id}`);
    },

    getModelAssociationsById: async (id: string) => {
      if (mock.value.enabled) {
        await mockDelay();
        const associationsJson = await import(
          '~/mocks/get.models.details.associations.json'
        );
        return Promise.resolve(
          associationsJson as {
            status_code: number;
            message: string;
            data: unknown;
          },
        );
      }
      return request(`/models/${id}/associations`);
    },

    getModelDetails: async (params: { id?: number; name?: string } = {}) => {
      if (mock.value.enabled) {
        await mockDelay();
        const model = mock.value.models.find((m) => m.id === params.id);
        return Promise.resolve({
          status_code: 200,
          message: 'Mock model details',
          data: model ? [model] : [],
        });
      }
      if (params.id) {
        return request(`/models/${params.id}/associations`);
      }
      if (params.name) {
        return request(`/models/associations?name=${params.name}`);
      }
      return null;
    },

    getPipelineRunsList: async (params = {}) => {
      if (mock.value.enabled) {
        await mockDelay();
        const pipelinesJson = await import('~/mocks/get.pipelines.json');

        let filteredData = [...pipelinesJson.data];

        // Apply search filters
        const searchParams = params as Record<string, string>;

        // Filter by ID
        if (searchParams.id) {
          filteredData = filteredData.filter((pipeline) =>
            pipeline.run_id
              .toLowerCase()
              .includes(searchParams.id.toLowerCase()),
          );
        }

        // Filter by name
        if (searchParams.name) {
          filteredData = filteredData.filter((pipeline) =>
            pipeline.run_name
              .toLowerCase()
              .includes(searchParams.name.toLowerCase()),
          );
        }

        // Handle pagination
        const page = parseInt(searchParams.page || '1');
        const limit = parseInt(searchParams.limit || '10');
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return Promise.resolve({
          status_code: pipelinesJson.status_code,
          message: pipelinesJson.message,
          data: paginatedData,
          pagination: {
            total: filteredData.length,
            page: page,
            limit: limit,
            total_pages: Math.ceil(filteredData.length / limit),
          },
        });
      }
      return request(`/pipelines/runs`);
    },

    deleteDatasetFile: async (id: number | string) => {
      if (mock.value.enabled) {
        await mockDelay();
        return Promise.resolve({
          success: true,
          message: 'Dataset file deleted successfully',
        });
      }
      return request(`/datasets/file/${id}`, 'DELETE', undefined, {
        successMessage: 'dataset_deleted',
      });
    },

    deleteDatasetBroker: async (id: number | string) => {
      if (mock.value.enabled) {
        await mockDelay();
        return Promise.resolve({
          success: true,
          message: 'Dataset broker deleted successfully',
        });
      }
      return request(`/datasets/broker/${id}`, 'DELETE', undefined, {
        successMessage: 'dataset_deleted',
      });
    },

    deleteDatasetTopic: async (id: number | string) => {
      if (mock.value.enabled) {
        await mockDelay();
        return Promise.resolve({
          success: true,
          message: 'Dataset topic deleted successfully',
        });
      }
      return request(`/datasets/topic/${id}`, 'DELETE', undefined, {
        successMessage: 'dataset_deleted',
      });
    },

    deleteDatasetMessage: async (id: number | string) => {
      if (mock.value.enabled) {
        await mockDelay();
        return Promise.resolve({
          success: true,
          message: 'Dataset message deleted successfully',
        });
      }
      return request(`/datasets/message/${id}`, 'DELETE', undefined, {
        successMessage: 'dataset_deleted',
      });
    },

    getBrokerDetails: async () => {
      if (mock.value.enabled) {
        await mockDelay();
        return Promise.resolve({
          status_code: 200,
          message: 'Mock broker details',
          data: [],
        });
      }
      return request(`/broker/details`);
    },

    getTopicDetails: async () => {
      if (mock.value.enabled) {
        await mockDelay();
        return Promise.resolve({
          status_code: 200,
          message: 'Mock topic details',
          data: [],
        });
      }
      return request(`/topic/details`);
    },

    getPipelineRunFlow: async (id: string) => {
      console.log('getPipelineRunFlow', id, mock.value.enabled);
      if (mock.value.enabled) {
        await mockDelay();
        // Return LSTM pipeline mock data if ID matches
        if (id === 'af31bfc5-0bb9-4520-86e3-30009ff7f805') {
          const lstmPipeline = await import(
            '~/mocks/get.runs.lstm-pipeline.json'
          );
          return Promise.resolve(lstmPipeline);
        }

        console.log('---->', id);

        // Return wine pipeline mock data if ID matches
        if (id === 'c4f73142-5412-4908-ba47-cd5654df9fb5') {
          const winePipeline = await import(
            '~/mocks/get.runs.wine-pipeline.json'
          );
          return Promise.resolve(winePipeline);
        }

        // Return federation pipeline mock data if ID matches
        if (id === '1dd209cc-7952-4b1d-b4dd-90f8d891dc7d') {
          const federationPipeline = await import(
            '~/mocks/get.runs.federation.json'
          );
          return Promise.resolve(federationPipeline);
        }

        // LLM serve pipeline run (Qwen2.5 coder) – use detailed mock JSON
        if (id === '825bd04f-5114-4156-9a09-fa1c4c70b20a') {
          const llmServeFlow = await import('~/mocks/get.runs.llm-flow.json');
          return Promise.resolve(llmServeFlow);
        }

        // Return detailed federation pipeline data from testdata.fed.json
        if (id === 'e3450222-f475-4062-953b-230836ca00c8') {
          console.log('Loading get.runs.fed.json for ID:', id);
          const testdataFed = await import('~/mocks/get.runs.fed.json');
          console.log('Loaded data:', testdataFed);
          return Promise.resolve(testdataFed);
        }

        return Promise.resolve({
          status_code: 200,
          message: 'Mock pipeline run flow data',
          data: {
            run_id: id,
            run_name: 'Mock Pipeline Run',
            status: 'Succeeded',
            nodes: [],
            edges: [],
          },
        });
      }
      // This uses external API, not the base URL
      const config = useRuntimeConfig();
      const apiRuns = config.public.apiRuns;
      const url = `${apiRuns}/runs/${id}`;
      return request(url);
    },

    getPipelineVersion: async (pipelineId: string, versionId: string) => {
      if (mock.value.enabled) {
        await mockDelay();
        // Return LSTM pipeline version if IDs match
        if (
          pipelineId === 'eaca6329-63d9-4306-a135-d5ba0ddab377' &&
          versionId === 'af02ec0c-67e2-47d5-a0a3-a416893c6b2d'
        ) {
          const lstmVersion = await import(
            '~/mocks/get.pipeline-version.lstm.json'
          );
          return Promise.resolve(lstmVersion);
        }

        return Promise.resolve({
          status_code: 404,
          message: 'Pipeline version not found',
          data: null,
        });
      }
      return request(`/pipelines/${pipelineId}/versions/${versionId}`);
    },

    getTrainingBuilderComponents: async () => {
      if (mock.value.enabled) {
        await mockDelay();
        const componentsJson = await import(
          '~/mocks/get.training-builder-components.json'
        );
        return Promise.resolve({
          status_code: componentsJson.status_code,
          message: componentsJson.message,
          data: componentsJson.data,
        });
      }
      return request(`/training-builder-components`);
    },

    getHeaders: async () => {
      if (mock.value.enabled) {
        await mockDelay();
        return Promise.resolve({
          status_code: 200,
          message: 'Mock headers data',
          data: {
            'kubeflow-userid': mock.value.user.email,
          },
        });
      }
      return request(`/headers`);
    },

    getArtifactPreview: async (artifactUrl: string) => {
      if (mock.value.enabled) {
        await mockDelay(300);

        // Extract filename from the full URL for mock lookup
        const fileName = artifactUrl.split('/').pop() || '';

        // Map file names to mock data
        const mockFiles: Record<string, () => Promise<unknown>> = {
          'conda.yaml': () => import('~/mocks/artifacts/conda.yaml?raw'),
          'python_env.yaml': () =>
            import('~/mocks/artifacts/python_env.yaml?raw'),
          'requirements.txt': () =>
            import('~/mocks/artifacts/requirements.txt?raw'),
          MLmodel: () => import('~/mocks/artifacts/MLmodel?raw'),
          'confusion_matrix.json': () =>
            import('~/mocks/artifacts/confusion_matrix.json'),
          'input_example.json': () =>
            import('~/mocks/artifacts/input_example.json'),
          'serving_input_example.json': () =>
            import('~/mocks/artifacts/serving_input_example.json'),
          'cv_results.csv': () =>
            import('~/mocks/artifacts/cv_results.csv?raw'),
        };

        const ext = fileName.split('.').pop()?.toLowerCase() || '';

        if (mockFiles[fileName]) {
          const data = await mockFiles[fileName]();
          const content = data.default || data;

          // For CSV, parse into headers and rows
          if (ext === 'csv') {
            const lines = content.trim().split('\n');
            const headers = lines[0].split(',');
            const rows = lines.slice(1).map((line: string) => line.split(','));
            return Promise.resolve({
              status_code: 200,
              message: 'Artifact preview loaded',
              data: { type: 'csv', headers, rows },
            });
          }

          // For JSON, return parsed object
          if (ext === 'json') {
            return Promise.resolve({
              status_code: 200,
              message: 'Artifact preview loaded',
              data: { type: 'json', content: JSON.stringify(content, null, 2) },
            });
          }

          // For text/yaml files, return raw content
          return Promise.resolve({
            status_code: 200,
            message: 'Artifact preview loaded',
            data: { type: 'text', content },
          });
        }

        // For images, return a placeholder URL
        if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
          return Promise.resolve({
            status_code: 200,
            message: 'Artifact preview loaded',
            data: {
              type: 'image',
              url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Confusion_matrix.svg/400px-Confusion_matrix.svg.png',
            },
          });
        }

        // Default fallback
        return Promise.resolve({
          status_code: 404,
          message: 'Preview not available',
          data: null,
        });
      }
      // Real API: /models/artifact/preview?url=<encoded_s3_url>
      return request(
        `/models/artifact/preview?url=${encodeURIComponent(artifactUrl)}`,
      );
    },
  };
};
