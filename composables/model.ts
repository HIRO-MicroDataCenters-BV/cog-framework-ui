import type { ApiResponse, ApiErrorResponse } from '@/schemas/response.schema';
import type { FormValues } from '~/types/form.types';

export interface ModelFormValues extends FormValues {
  type?: 'file' | 'datastream';
  metadata?: {
    name?: string;
    description?: string;
    model_type?: string;
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
  const { postRegisterModel, postUploadModelFile } = useApi();

  const submitModelForm = async (
    values: ModelFormValues,
  ): Promise<ModelFormResponse | undefined> => {
    try {
      console.log('submitModelForm values:', values);

      // Robust file extraction
      let fileList = values.file?.files;
      if (fileList && !Array.isArray(fileList)) {
        fileList = [fileList] as File[];
      }

      // 1. Validate required fields
      if (!values.metadata?.name?.trim()) {
        throw new Error('error.model_name_required');
      }

      if (!fileList?.length) {
        throw new Error('error.no_file_selected');
      }

      // 2. Register model with JSON (name, type, description)
      console.log('Step 1: Registering model with JSON');
      const registerPayload = {
        name: values.metadata.name.trim(),
        type: values.metadata.model_type || 'default',
        description: values.metadata.description || '',
      };

      const registerRes = (await postRegisterModel(registerPayload)) as Record<
        string,
        unknown
      >;

      if (
        !registerRes ||
        !registerRes.data ||
        typeof registerRes.data !== 'object' ||
        registerRes.data === null
      ) {
        throw new Error('error.model_registration_failed');
      }

      const responseData = registerRes.data as Record<string, unknown>;
      if (!responseData.id) {
        throw new Error('error.model_registration_failed');
      }

      const modelId = responseData.id as string;
      console.log('Model registered, ID:', modelId);

      // 3. Upload file with FormData to /models/{id}/file
      console.log('Step 2: Uploading file with FormData');
      const uploadRes = (await postUploadModelFile(
        modelId,
        fileList,
      )) as Record<string, unknown>;

      if (!uploadRes || !uploadRes.data) {
        throw new Error('error.file_upload_failed');
      }

      console.log('File uploaded successfully');
      return registerRes;
    } catch (error) {
      console.error('Error in submitModelForm:', error);
      throw error;
    }
  };

  return {
    submitModelForm,
  };
};
