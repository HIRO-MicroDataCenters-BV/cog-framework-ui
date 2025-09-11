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
  const realApi = useApi();

  return {
    getDatasetsForTable: (params = {}) => {
      if (mock.value.enabled) {
        return Promise.resolve({
          success: true,
          data: mock.value.datasets,
          message: 'Mock datasets data',
        });
      }
      return realApi.getDatasetsForTable(params);
    },

    fetchDatasets: (params = {}) => {
      if (mock.value.enabled) {
        if (params.dataset_id) {
          const dataset = mock.value.datasets.find(
            (d) => d.id === params.dataset_id,
          );
          return Promise.resolve({
            success: true,
            data: dataset ? [dataset] : [],
            message: 'Mock dataset data',
          });
        }
        return Promise.resolve({
          success: true,
          data: mock.value.datasets,
          message: 'Mock datasets data',
        });
      }
      return realApi.fetchDatasets(params);
    },

    getModelsForTable: (params = {}) => {
      if (mock.value.enabled) {
        return Promise.resolve({
          success: true,
          data: mock.value.models,
          message: 'Mock models data',
        });
      }
      return realApi.getModelsForTable(params);
    },

    getModelDetails: (params = {}) => {
      if (mock.value.enabled) {
        const model = mock.value.models.find((m) => m.id === params.id);
        return Promise.resolve({
          success: true,
          data: model ? [model] : [],
          message: 'Mock model details',
        });
      }
      return realApi.getModelDetails(params);
    },

    getAllPipelineRuns: () => {
      if (mock.value.enabled) {
        return Promise.resolve({
          success: true,
          data: mock.value.pipelineRuns,
          message: 'Mock pipeline runs data',
        });
      }
      return realApi.getAllPipelineRuns();
    },

    deleteDatasetFile: (id) => {
      if (mock.value.enabled) {
        return Promise.resolve({
          success: true,
          message: 'Dataset file deleted successfully',
        });
      }
      return realApi.deleteDatasetFile(id);
    },

    deleteDatasetBroker: (id) => {
      if (mock.value.enabled) {
        return Promise.resolve({
          success: true,
          message: 'Dataset broker deleted successfully',
        });
      }
      return realApi.deleteDatasetBroker(id);
    },

    deleteDatasetTopic: (id) => {
      if (mock.value.enabled) {
        return Promise.resolve({
          success: true,
          message: 'Dataset topic deleted successfully',
        });
      }
      return realApi.deleteDatasetTopic(id);
    },

    deleteDatasetMessage: (id) => {
      if (mock.value.enabled) {
        return Promise.resolve({
          success: true,
          message: 'Dataset message deleted successfully',
        });
      }
      return realApi.deleteDatasetMessage(id);
    },
  };
};
