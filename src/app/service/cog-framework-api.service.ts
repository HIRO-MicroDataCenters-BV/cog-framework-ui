import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {ModelInfo, ModelInfoById} from '../model/ModelInfo';
import {
    DatasetInfo,
    DatasetByName,
    UploadedDataset,
} from '../model/DatasetInfo';
import {ModelDetailInfo} from '../model/ModelDetails';
import {DataSetDetailInfo} from '../model/DataSetDetailInfo';
import {ValidationArtifactsResponse} from '../model/ValidationArtifacts';
import {S3Request} from '../model/S3Request';
import {ValidationMetricsResponse} from '../model/ValidationMetrics';

@Injectable({
    providedIn: 'root',
})
export class CogFrameworkApiService {
    private baseURL: string = environment.appURL;

    constructor(private httpClient: HttpClient) {
    }

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

    deleteModelById(id: number): Observable<any> {
        return this.httpClient.delete<any>(
            `${this.baseURL}/delete_model_details?model_id=${id}`,
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
        return this.httpClient.get<any>(`${this.baseURL}/pipeline/${id}`);
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
            {responseType: 'text' as any},
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
