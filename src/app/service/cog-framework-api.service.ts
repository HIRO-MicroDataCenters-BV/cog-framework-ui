import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { ModelInfo, ModelInfoById } from "../model/ModelInfo";
import { DatasetInfo, DatasetByName } from "../model/DatasetInfo";
import { ModelDetailInfo } from "../model/ModelDetails";
import { DataSetDetailInfo } from "../model/DataSetDetailInfo";
import { ValidationArtifactsResponse } from "../model/ValidationArtifacts";
import { S3Request } from "../model/S3Request";
import { ValidationMetricsResponse } from "../model/ValidationMetrics";

@Injectable({
  providedIn: "root",
})
export class CogFrameworkApiService {
  private baseURL: string = environment.appURL;

  constructor(private httpClient: HttpClient) { }

  getModelByName(name: string): Observable<ModelInfo> {
    return this.httpClient.get<ModelInfo>(`${this.baseURL}/models/${name}`);
  }

  getModelById(id: string): Observable<ModelInfoById> {
    return this.httpClient.get<ModelInfoById>(`${this.baseURL}/models/${id}`);
  }

  getModelDetailById(id: string): Observable<ModelDetailInfo> {
    return this.httpClient.get<ModelDetailInfo>(
      `${this.baseURL}/model_details?id=${id}`,
    );
  }

  getDataSetDetailById(id: string): Observable<DataSetDetailInfo> {
    return this.httpClient.get<DataSetDetailInfo>(
      `${this.baseURL}/dataset/details?id=${id}`,
    );
  }

  getDataSetDetailByName(name: string): Observable<DatasetByName> {
    return this.httpClient.get<DatasetByName>(
      `${this.baseURL}/dataset/${name}`,
    );
  }

  getPipelineByModelID(id: string): Observable<any> {
    const url = this.modeAPIURL + "/pipeline/" + id;
    return this.httpClient.get<any>(url);
  }

  // dataset apis
  getDatasetById(id: string): Observable<DatasetInfo> {
    return this.httpClient.get<DatasetInfo>(`${this.baseURL}/dataset/${id}`);
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
  getModelValidationCSV(csvFile: string): Observable<any> {
    return this.httpClient.get<any>(
      `${this.baseURL}/s3/get_image?url=${csvFile}`,
      { responseType: "text" as any },
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
  }): Observable<any> {
    const formData = new FormData();
    console.log(
      `uploadDataset: file=${file}, user_id=${user_id}, name=${name}, type=${type}, description=${description}`,
    );
    formData.append("file", file);
    formData.append("user_id", user_id);
    formData.append("name", name);
    formData.append("type", type);
    formData.append("description", description);
    return this.httpClient.post(`${this.baseURL}/dataset`, formData);
  }
}
