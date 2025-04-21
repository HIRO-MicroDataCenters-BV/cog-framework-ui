import { useApi } from '@/composables/api';
//import { useToast } from '@/composables/toast';
import type { ApiResponse, ApiErrorResponse } from '@/schemas/response.schema';

type DatasetRegisterResponse = ApiResponse | ApiErrorResponse | null;
// import type { Dataset } from '@/schemas/dataset.schema';
import type {
  FileDatasetValues,
  TableDatasetValues,
  StreamDatasetValues,
  DatasetFormValues,
  FileDatasetRegisterParams,
  TableDatasetRegisterParams,
  StreamDatasetRegisterParams,
} from '@/types/api';

export const registerFileDataset = async (
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

export const registerTableDataset = async (
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

export const registerStreamDataset = async (
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

export const submitDatasetForm = async (
  values: DatasetFormValues,
): Promise<DatasetRegisterResponse | undefined> => {
  //const toast = useToast();
  //toast.info('info.dataset_add_started');
  if (!values) {
    //toast.error(null, 'error.no_values_provided');
    return;
  }

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
    /*
    if (res && 'data' in res && res.data) {
      const dataset = res.data as Dataset;
      
      toast.success('success.dataset_added', {
        id: dataset.id,
        name: values.metadata?.name || '',
      });
      
    } else {
      toast.success('success.dataset_added', { name: values?.metadata?.name });
    }
    */

    return res;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'error.dataset_add_failed';
    //toast.error(error, errorMessage);
    throw error;
  }
};
