import type { ApiResponse, ApiErrorResponse } from '@/schemas/response.schema';

import type {
  FileDatasetValues,
  TableDatasetValues,
  StreamDatasetValues,
  DatasetFormValues,
  FileDatasetRegisterParams,
  TableDatasetRegisterParams,
  BrokerRegisterParams,
  TopicRegisterParams,
  DatasetMessageRegisterParams,
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
      dataset_type: values.dataset_type || 0,
      description: values.metadata?.description || '',
      id: '', // Not used by postDatasetFile, but required by type
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
      dataset_type: values.dataset_type || 0,
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
  const { postDatasetBroker, postDatasetTopic, postDatasetMessage } = useApi();

  const registerStreamDataset = async (
    values: StreamDatasetValues,
  ): Promise<DatasetRegisterResponse> => {
    if (!values.source_settings?.broker_name) {
      throw new Error('error.broker_name_required');
    }
    if (!values.source_settings?.broker_ip_address) {
      throw new Error('error.broker_ip_address_required');
    }
    if (!values.source_settings?.topic_name) {
      throw new Error('error.topic_name_required');
    }

    const brokerData: BrokerRegisterParams = {
      name: values.source_settings.broker_name,
      ip: values.source_settings.broker_ip_address,
      port: values.source_settings.broker_port || 4222,
    };

    const brokerResponse = await postDatasetBroker(brokerData);

    if (!brokerResponse || 'detail' in brokerResponse) {
      throw new Error('error.broker_registration_failed');
    }

    let brokerId: number;
    if ('data' in brokerResponse && brokerResponse.data) {
      if (
        typeof brokerResponse.data === 'object' &&
        'id' in brokerResponse.data
      ) {
        brokerId = brokerResponse.data.id as number;
      } else if (
        typeof brokerResponse.data === 'object' &&
        'broker_id' in brokerResponse.data
      ) {
        brokerId = brokerResponse.data.broker_id as number;
      } else {
        throw new Error('error.broker_id_not_found_in_response');
      }
    } else {
      throw new Error('error.broker_id_not_found_in_response');
    }

    const topicSchema = values.source_settings.topic_schema;
    const topicData: TopicRegisterParams = {
      name: values.source_settings.topic_name,
      schema: topicSchema
        ? typeof topicSchema === 'string'
          ? topicSchema
          : JSON.stringify(topicSchema)
        : undefined,
    };

    const topicResponse = await postDatasetTopic(brokerId, topicData);

    if (!topicResponse || 'detail' in topicResponse) {
      throw new Error('error.topic_registration_failed');
    }

    let topicId: number;
    if ('data' in topicResponse && topicResponse.data) {
      if (
        typeof topicResponse.data === 'object' &&
        'id' in topicResponse.data
      ) {
        topicId = topicResponse.data.id as number;
      } else if (
        typeof topicResponse.data === 'object' &&
        'topic_id' in topicResponse.data
      ) {
        topicId = topicResponse.data.topic_id as number;
      } else {
        throw new Error('error.topic_id_not_found_in_response');
      }
    } else {
      throw new Error('error.topic_id_not_found_in_response');
    }

    const messageData: DatasetMessageRegisterParams = {
      dataset_type: values.dataset_type || 0,
      name: values.metadata?.name || '',
      description: values.metadata?.description || '',
      broker_id: brokerId,
      topic_id: topicId,
    };

    return await postDatasetMessage(messageData);
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
