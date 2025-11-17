import type { ApiResponse, ApiErrorResponse } from '@/schemas/response.schema';

import type {
  FileDatasetValues,
  TableDatasetValues,
  StreamDatasetValues,
  DatasetFormValues,
  FileDatasetRegisterParams,
  TableDatasetRegisterParams,
  StreamDatasetRegisterParams,
} from '~/types/api.types';

type DatasetRegisterResponse = ApiResponse | ApiErrorResponse | null;

export const useRegisterFileDataset = () => {
  const { postDatasetFile } = useApi();

  const registerFileDataset = async (
    values: FileDatasetValues,
  ): Promise<DatasetRegisterResponse> => {
    const files = values.source_settings?.dataset_file
      ? [values.source_settings.dataset_file]
      : [];

    if (files.length === 0) {
      throw new Error('error.no_file_selected');
    }

    return await postDatasetFile({
      files,
      name: values.metadata?.name || '',
      dataset_type: 2,
      description: values.metadata?.description || '',
      id: 0, // Not used by postDatasetFile, but required by type
    });
  };

  return {
    registerFileDataset,
  };
};

export const useRegisterTableDataset = () => {
  const { postDatasetTable } = useApi();

  const registerTableDataset = async (
    values: TableDatasetValues,
  ): Promise<DatasetRegisterResponse> => {
    const data: TableDatasetRegisterParams = {
      dataset_type: 0,
      name: values.metadata?.name || '',
      description: values.metadata?.description || '',
      db_url: values.source_settings?.db_url || '',
      table_name: values.source_settings?.table_name || '',
      selected_fields: values.source_settings?.selected_fields || '',
    };

    return await postDatasetTable(data);
  };

  return {
    registerTableDataset,
  };
};

export const useRegisterStreamDataset = () => {
  const { postDatasetBroker } = useApi();

  const registerStreamDataset = async (
    values: StreamDatasetValues,
  ): Promise<DatasetRegisterResponse> => {
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

    return await postDatasetBroker(data);
  };

  return {
    registerStreamDataset,
  };
};

export const useDatasetForm = () => {
  // Инициализация всех composables на верхнем уровне
  const { registerFileDataset } = useRegisterFileDataset();
  const { registerTableDataset } = useRegisterTableDataset();
  const { registerStreamDataset } = useRegisterStreamDataset();

  const submitDatasetForm = async (
    values: DatasetFormValues,
  ): Promise<DatasetRegisterResponse | undefined> => {
    if (!values.type) {
      throw new Error('error.dataset_type_required');
    }

    try {
      let res: DatasetRegisterResponse;

      switch (values.type) {
        case 'file':
          res = await registerFileDataset(values as FileDatasetValues);
          break;
        case 'table':
          res = await registerTableDataset(values as TableDatasetValues);
          break;
        case 'data_stream':
          res = await registerStreamDataset(values as StreamDatasetValues);
          break;
        default:
          throw new Error(`error.unknown_dataset_type: ${values.type}`);
      }

      return res;
    } catch (error) {
      console.error('Error in submitDatasetForm:', error);
      throw error;
    }
  };

  return {
    submitDatasetForm,
  };
};
