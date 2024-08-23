import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GetModelParams, ModelInfo } from '../model/ModelInfo';
import {
  DatasetById, DataSetData,
  DatasetInfo,
  GetDatasetParams,
  UploadedDataset,
} from '../model/DatasetInfo';
import { ModelDetailInfo } from '../model/ModelDetails';
import { DataSetDetailInfo } from '../model/DataSetDetailInfo';
import { ValidationArtifactsResponse } from '../model/ValidationArtifacts';
import { ValidationMetricsResponse } from '../model/ValidationMetrics';
import { DeleteResponse } from '../model/DeleteResponse';
import { PipelineResponse } from '../model/PipeLine';
import { ModelServe } from '../model/ModelServe';
import { ModelServeResponse } from '../model/ModelServeResponse';

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
      `${this.baseURL}/model_details?id=${id}`,
    );
  }

  deleteModelById(id: number): Observable<DataSetData> {
    return this.httpClient.delete<DataSetData>(
      `${this.baseURL}/delete_model_details?model_id=${id}`,
    );
  }

  getDataSetDetailById(id: string): Observable<DataSetDetailInfo> {
    return this.httpClient.get<DataSetDetailInfo>(
      `${this.baseURL}/dataset/details?id=${id}`,
    );
  }

  deleteDataSetDetailById(id: number): Observable<DeleteResponse> {
    return this.httpClient.delete<DeleteResponse>(
      `${this.baseURL}/dataset/${id}`,
    );
  }

  getPipelineByModelID(id: string): Observable<PipelineResponse> {
    return this.httpClient.get<PipelineResponse>(
      `${this.baseURL}/pipeline/${id}`,
    );
  }

  // dataset apis
  getDatasetById(id: string): Observable<DatasetById> {
    return this.httpClient.get<DatasetById>(`${this.baseURL}/dataset/${id}`);
  }

  getDataset(params: GetDatasetParams = ''): Observable<DatasetInfo> {
    return this.httpClient.get<DatasetInfo>(
      `${this.baseURL}/dataset/${params}`,
    );
  }

  getModelValidationArtifactById(
    modelId: string,
  ): Observable<ValidationArtifactsResponse> {
    return this.httpClient.get<ValidationArtifactsResponse>(
      `${this.baseURL}/validation/artifact/model_id/${modelId}`,
    );
  }

  getModelValidationArtifactByName(
    modelName: string,
  ): Observable<ValidationArtifactsResponse> {
    return this.httpClient.get<ValidationArtifactsResponse>(
      `${this.baseURL}/validation/artifact/model_name/${modelName}`,
    );
  }

  getModelValidationMetricsById(
    modelId: string,
  ): Observable<ValidationMetricsResponse> {
    return this.httpClient.get<ValidationMetricsResponse>(
      `${this.baseURL}/validation/metrics/model_id/${modelId}`,
    );
  }

  getModelValidationMetricsByName(
    modelName: string,
  ): Observable<ValidationMetricsResponse> {
    return this.httpClient.get<ValidationMetricsResponse>(
      `${this.baseURL}/validation/metrics/model_name/${modelName}`,
    );
  }

  //s3://mlflow/per_class_metrics.csv
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
    file,
    user_id,
    name,
    type,
    description,
  }: {
    file: File;
    user_id: string;
    name: string;
    type: string;
    description: string;
  }): Observable<UploadedDataset> {
    const formData = new FormData();
    formData.append('file', file);
    const params = encodeURI(
      new HttpParams()
        .set('user_id', user_id)
        .set('dataset_name', name)
        .set('dataset_type', type)
        .set('description', description)
        .toString(),
    );
    const url = `${this.baseURL}/dataset?${params}`;
    return this.httpClient.post<UploadedDataset>(url, formData);
  }

  uploadModel({
    file,
    user_id,
    model_id,
    model_file_type,
    model_file_description,
  }: {
    file: File;
    user_id: string;
    model_id: string;
    model_file_type: string;
    model_file_description: string;
  }): Observable<UploadedDataset> {
    const formData = new FormData();
    formData.append('file', file);
    const params = encodeURI(
      new HttpParams()
        .set('user_id', user_id)
        .set('model_id', model_id)
        .set('model_file_type', model_file_type)
        .set('model_file_description', model_file_description)
        .toString(),
    );
    const url = `${this.baseURL}/models/upload?${params}`;
    return this.httpClient.post<UploadedDataset>(url, formData);
  }
}
