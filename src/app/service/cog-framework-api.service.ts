import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GetModelParams, ModelInfo } from '../model/ModelInfo';
import {
  //DatasetById,
  DatasetData,
  DatasetInfo,
  GetDatasetParams,
  UploadedDataset,
} from '../model/DatasetInfo';
import { DatasetById } from '../model/DataSetDetailInfo';
import { ModelDetailInfo } from '../model/ModelDetails';
import { DataSetDetailInfo } from '../model/DataSetDetailInfo';
import {
  GetValidationArtifactsParams,
  ValidationArtifactsResponse,
} from '../model/ValidationArtifacts';
import {
  GetValidationMetricsParams,
  ValidationMetricsResponse,
} from '../model/ValidationMetrics';
import { DeleteResponse } from '../model/DeleteResponse';
import { ModelServe } from '../model/ModelServe';
import { ModelServeResponse } from '../model/ModelServeResponse';
import { UploadedModelFile } from '../model/ModelFile';
import { GetPipelineParams, PipelineResponse } from '../model/Pipeline';

@Injectable({
  providedIn: 'root',
})
export class CogFrameworkApiService {
  private baseURL: string = environment.appURL;

  constructor(private httpClient: HttpClient) {}

  getModel(params: GetModelParams = {}): Observable<ModelInfo> {
    return this.httpClient.get<ModelInfo>(`${this.baseURL}/models`, {
      params,
    });
  }

  getModelDetailById(id: string): Observable<ModelDetailInfo> {
    return this.httpClient.get<ModelDetailInfo>(
      `${this.baseURL}/models/details?model_id=${id}`,
    );
  }

  deleteModelById(id: number): Observable<DatasetData> {
    return this.httpClient.delete<DatasetData>(
      `${this.baseURL}/delete_model_details?model_id=${id}`,
    );
  }

  getDatasetDetailById(id: string): Observable<DataSetDetailInfo> {
    return this.httpClient.get<DataSetDetailInfo>(
      `${this.baseURL}/dataset/details?id=${id}`,
    );
  }

  deleteDatasetById(id: number): Observable<DeleteResponse> {
    return this.httpClient.delete<DeleteResponse>(
      `${this.baseURL}/datasets/${id}`,
    );
  }

  getPipeline(params: GetPipelineParams = {}): Observable<PipelineResponse> {
    return this.httpClient.get<PipelineResponse>(
      `${this.baseURL}/pipelines/component`,
      { params },
    );
  }
  getPipelineByRun(
    params: GetPipelineParams = {},
  ): Observable<PipelineResponse> {
    return this.httpClient.get<PipelineResponse>(
      `${this.baseURL}/pipelines/component/run`,
      { params },
    );
  }
  /*
  getPipelineByModelID(id: string): Observable<PipelineResponse> {
    return this.httpClient.get<PipelineResponse>(
      `${this.baseURL}/pipeline/${id}`,
    );
  }
  */

  // dataset apis
  getDatasetById(id: string): Observable<DatasetById> {
    return this.httpClient.get<DatasetById>(`${this.baseURL}/dataset/${id}`);
  }

  getDataset(params: GetDatasetParams = {}): Observable<DatasetInfo> {
    return this.httpClient.get<DatasetInfo>(`${this.baseURL}/datasets`, {
      params,
    });
  }

  getModelValidationArtifacts(
    params: GetValidationArtifactsParams = {},
  ): Observable<ValidationArtifactsResponse> {
    return this.httpClient.get<ValidationArtifactsResponse>(
      `${this.baseURL}/validation/artifacts`,
      { params },
    );
  }

  getModelValidationMetrics(
    params: GetValidationMetricsParams = {},
  ): Observable<ValidationMetricsResponse> {
    return this.httpClient.get<ValidationMetricsResponse>(
      `${this.baseURL}/validation/metrics`,
      { params },
    );
  }

  getModelValidationCSV(csvFile: string): Observable<string> {
    return this.httpClient.get<string>(
      `${this.baseURL}/s3/get_image?url=${csvFile}`,
      { responseType: 'text' as never },
    );
  }

  serveModel(modelServe: ModelServe): Observable<ModelServeResponse> {
    return this.httpClient.post<ModelServeResponse>(
      `${this.baseURL}/models/deploy`,
      modelServe,
    );
  }

  uploadDataset({
    files,
    name,
    type,
    description,
  }: {
    files: File[];
    name: string;
    type: string;
    description: string;
  }): Observable<UploadedDataset> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    formData.append('dataset_name', name);
    formData.append('dataset_type', type);
    formData.append('description', description);

    const url = `${this.baseURL}/datasets`;
    return this.httpClient.post<UploadedDataset>(url, formData);
  }

  uploadModel({
    files,
    model_id,
    model_file_type,
    model_file_description,
  }: {
    files: File[];
    model_id: string;
    model_file_type: string;
    model_file_description: string;
  }): Observable<UploadedModelFile> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    formData.append('model_id', model_id);
    formData.append('file_type', model_file_type);
    formData.append('file_description', model_file_description);
    const url = `${this.baseURL}/models/file`;
    return this.httpClient.post<UploadedModelFile>(url, formData);
  }
}
