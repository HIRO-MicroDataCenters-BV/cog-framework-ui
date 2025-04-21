import type { ApiResponse, ApiErrorResponse } from '@/schemas/response.schema';

import type {
  FileDatasetValues,
  TableDatasetValues,
  StreamDatasetValues,
  DatasetFormValues,
  FileDatasetRegisterParams,
  TableDatasetRegisterParams,
  StreamDatasetRegisterParams,
} from '@/types/api';

type DatasetRegisterResponse = ApiResponse | ApiErrorResponse | null;

export const useRegisterFileDataset = () => {
  const registerFileDataset = async (
    values: FileDatasetValues,
  ): Promise<DatasetRegisterResponse> => {
    const { datasetFileRegister } = useApi();
    const files = values.source_settings?.dataset_file
      ? [values.source_settings.dataset_file]
      : [];

    if (files.length === 0) {
      throw new Error('error.no_file_selected');
    }

    const data: FileDatasetRegisterParams = {
      files,
      name: values.metadata?.name || '',
      dataset_type: 2,
      description: values.metadata?.description || '',
    };

    return await datasetFileRegister(data);
  };

  return {
    registerFileDataset,
  };
};

export const useRegisterTableDataset = () => {
  const registerTableDataset = async (
    values: TableDatasetValues,
  ): Promise<DatasetRegisterResponse> => {
    const { datasetTableRegister } = useApi();
    const data: TableDatasetRegisterParams = {
      dataset_type: 0,
      name: values.metadata?.name || '',
      description: values.metadata?.description || '',
      db_url: values.source_settings?.db_url || '',
      table_name: values.source_settings?.table_name || '',
      selected_fields: values.source_settings?.selected_fields || '',
    };

    return await datasetTableRegister(data);
  };

  return {
    registerTableDataset,
  };
};

export const useRegisterStreamDataset = () => {
  const registerStreamDataset = async (
    values: StreamDatasetValues,
  ): Promise<DatasetRegisterResponse> => {
    const { datasetKafkaRegister } = useApi();

    const data: StreamDatasetRegisterParams = {
      dataset_type: 0,
      dataset_name: values.metadata?.name || '',
      description: values.metadata?.description || '',
      broker_name: values.source_settings?.broker_name || '',
      broker_ip_address: values.source_settings?.broker_ip_address || '',
      broker_port: values.source_settings?.broker_port || 9092,
      topic_name: values.source_settings?.topic_name || '',
      topic_schema: values.source_settings?.topic_schema || '',
    };

    return await datasetKafkaRegister(data);
  };

  return {
    registerStreamDataset,
  };
};

export const useDatasetForm = () => {
  const { registerFileDataset } = useRegisterFileDataset();
  const { registerTableDataset } = useRegisterTableDataset();
  const { registerStreamDataset } = useRegisterStreamDataset();

  const submitDatasetForm = async (
    values: DatasetFormValues,
  ): Promise<DatasetRegisterResponse | undefined> => {
    const toaster = useToaster();
    try {
      let res: DatasetRegisterResponse;

      switch (values.type) {
        case 'file':
          res = await registerFileDataset(values);
          break;
        case 'table':
          res = await registerTableDataset(values);
          break;
        case 'data_stream':
          res = await registerStreamDataset(values);
          break;
        default:
          throw new Error(`error.unknown_dataset_type`);
      }
      if (res && 'data' in res && res.data) {
        toaster.show('success', 'dataset_added');
      }

      return res;
    } catch (error) {
      console.log('error');
      console.log(error);
      toaster.show('error', 'dataset_add_failed');
      throw error;
    }
  };

  return {
    submitDatasetForm,
  };
};
