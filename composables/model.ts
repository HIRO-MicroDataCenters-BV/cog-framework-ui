import { useApi } from './api';
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

export const useModelForm = () => {
  const { postModelSave, postModelUri } = useApi();

  const submitModelForm = async (values: ModelFormValues) => {
    try {
      let res;

      switch (values.type) {
        case 'file':
          if (!values.file?.files?.length) {
            throw new Error('error.no_file_selected');
          }
          res = await postModelSave({
            files: values.file.files,
            model_name: values.metadata?.name || '',
            file_type: values.file.file_type?.toString() || '0',
            description: values.metadata?.description || '',
          });
          break;
        case 'datastream':
          if (!values.datastream?.uri) {
            throw new Error('error.no_uri_provided');
          }
          res = await postModelUri({
            model_id: values.datastream.model_id || '',
            file_type: values.datastream.file_type || 0,
            description: values.metadata?.description || '',
            uri: values.datastream.uri || '',
          });
          break;
        default:
          throw new Error(`error.unknown_model_type`);
      }

      return res;
    } catch (error) {
      console.error('Error submitting model form:', error);
      throw error;
    }
  };

  return {
    submitModelForm,
  };
};
