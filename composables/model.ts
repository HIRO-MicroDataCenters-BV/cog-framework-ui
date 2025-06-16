import { useApi } from './api';
import type { FormValues } from '~/types/form.types';

export interface ModelFormValues extends FormValues {
  type: 'file' | 'data_stream';
  file?: {
    model_id: string;
    file_type: number;
    file_description: string;
    files: File[];
  };
  data_stream?: {
    model_id: string;
    file_type: number;
    description: string;
    uri: string;
  };
}

export const useModelForm = () => {
  const { uploadModelFile, registerModelUri } = useApi();

  const submitModelForm = async (values: ModelFormValues) => {
    try {
      let res;

      switch (values.type) {
        case 'file':
          if (!values.file?.files?.length) {
            throw new Error('error.no_file_selected');
          }
          res = await uploadModelFile({
            files: values.file.files,
            model_id: values.file.model_id,
            file_type: values.file.file_type.toString(),
            file_description: values.file.file_description,
          });
          break;
        case 'data_stream':
          if (!values.uri) {
            throw new Error('error.no_uri_provided');
          }
          res = await registerModelUri({
            model_id: values.model_id,
            file_type: values.file_type,
            description: values.description,
            uri: values.uri,
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
