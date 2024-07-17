import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {ModelInfo, ModelInfoById} from "../model/ModelInfo";
import {DatasetByName, DatasetInfo} from "../model/DatasetInfo";
import {ModelDetailInfo} from "../model/ModelDetails";
import {DataSetDetailInfo} from "../model/DataSetDetailInfo";
import {ValidationArtifactsResponse} from "../model/ValidationArtifacts";
import {ValidationMetricsResponse} from "../model/ValidationMetrics";

@Injectable({
    providedIn: 'root'
})
export class CogFrameworkApiService {

    modeAPIURL = environment.appURL;

    constructor(private httpClient: HttpClient,) {
    }

    getModelByName(name: string): Observable<ModelInfo> {
        const url = this.modeAPIURL + '/models/' + name
        return this.httpClient.get<ModelInfo>(url);
    }

    getModelById(id: string): Observable<ModelInfoById> {
        const url = this.modeAPIURL + '/models/' + id
        return this.httpClient.get<ModelInfoById>(url);
    }

    getModelDetailById(id: string): Observable<ModelDetailInfo> {
        const url = this.modeAPIURL + '/model_details?id=' + id
        return this.httpClient.get<ModelDetailInfo>(url);
    }

    getDataSetDetailById(id: string): Observable<DataSetDetailInfo> {
        const url = this.modeAPIURL + '/dataset/details?id=' + id
        return this.httpClient.get<DataSetDetailInfo>(url);
    }

    getDataSetDetailByName(name: string): Observable<DatasetByName> {
        const url = this.modeAPIURL + '/dataset/' + name
        return this.httpClient.get<DatasetByName>(url);
    }

    getPipelineByModelID(id: string): Observable<any> {
        const url = this.modeAPIURL + '/pipeline/'+ id
        return this.httpClient.get<any>(url);
    }

    // dataset apis
    getDatasetById(id: string): Observable<DatasetInfo> {
        const url = this.modeAPIURL + '/dataset/' + id
        return this.httpClient.get<DatasetInfo>(url);
    }

    getModelValidationArtifactById(modelId: string): Observable<ValidationArtifactsResponse> {
        const url = this.modeAPIURL + '/validation/artifact/model_id/' + modelId
        return this.httpClient.get<ValidationArtifactsResponse>(url);
    }

    getModelValidationArtifactByName(modelName: string): Observable<ValidationArtifactsResponse> {
        const url = this.modeAPIURL + '/validation/artifact/model_name/' + modelName
        return this.httpClient.get<ValidationArtifactsResponse>(url);
    }

    getModelValidationMetricsById(modelId: string): Observable<ValidationMetricsResponse> {
        const url = this.modeAPIURL + '/validation/metrics/model_id/' + modelId
        return this.httpClient.get<ValidationMetricsResponse>(url);
    }

    getModelValidationMetricsByName(modelName: string): Observable<ValidationMetricsResponse> {
        const url = this.modeAPIURL + '/validation/metrics/model_name/' + modelName
        return this.httpClient.get<ValidationMetricsResponse>(url);
    }

    //s3://mlflow/per_class_metrics.csv
    getModelValidationCSV(csvFile: string): Observable<any> {
        const url = this.modeAPIURL + '/s3/get_image?url=' + csvFile;
        return this.httpClient.get<any>(url, {responseType: 'text' as any});
    }

}

