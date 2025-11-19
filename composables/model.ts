import type { ApiResponse, ApiErrorResponse } from '@/schemas/response.schema';
import type { FormValues } from '~/types/form.types';

export interface ModelFormValues extends FormValues {
  type?: 'file' | 'datastream';
  metadata?: {
    name?: string;
    description?: string;
  };
  file?: {
    file_type?: number;
    files?: File[];
  };
  datastream?: {
    model_id?: string;
    file_type?: number;
    uri?: string;
  };
}

type ModelFormResponse = ApiResponse | ApiErrorResponse | null;

export const useModelForm = () => {
  const { postModelSave, postModelUri } = useApi();

  const submitModelForm = async (
    values: ModelFormValues,
  ): Promise<ModelFormResponse | undefined> => {
    if (!values.type) {
      throw new Error('error.model_type_required');
    }

    try {
      let res: ModelFormResponse;

      switch (values.type) {
        case 'file':
          if (!values.file?.files?.length) {
            throw new Error('error.no_file_selected');
          }

          if (!values.metadata?.name?.trim()) {
            throw new Error('error.model_name_required');
          }

          res = await postModelSave({
            files: values.file.files,
            model_name: values.metadata.name.trim(),
            file_type: values.file.file_type?.toString() || '0',
            description: values.metadata?.description || '',
          });
          break;

        case 'datastream':
          if (!values.datastream?.uri?.trim()) {
            throw new Error('error.no_uri_provided');
          }

          if (!values.metadata?.name?.trim()) {
            throw new Error('error.model_name_required');
          }

          res = await postModelUri({
            model_id: values.datastream.model_id || '',
            file_type: values.datastream.file_type || 0,
            description: values.metadata?.description || '',
            uri: values.datastream.uri.trim(),
          });
          break;

        default:
          throw new Error(`error.unknown_model_type: ${values.type}`);
      }

      return res;
    } catch (error) {
      console.error('Error in submitModelForm:', error);
      throw error;
    }
  };

  return {
    submitModelForm,
  };
};
