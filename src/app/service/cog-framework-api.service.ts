import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {ModelInfo, ModelInfoById} from "../model/ModelInfo";
import {DatasetById} from "../model/DatasetInfo";
import {ModelDetailInfo} from "../model/ModelDetails";
import {ModelValidation} from "../model/ModelValidation";
import {DataSetDetailInfo} from "../model/DataSetDetailInfo";

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

    getModes(name: string): Observable<ModelInfo> {
        const url = this.modeAPIURL + '/models'
        return this.httpClient.get<ModelInfo>(url);
    }

    // dataset apis

    getDatasetById(id: string): Observable<DatasetById> {
        const url = this.modeAPIURL + '/dataset/' + id
        return this.httpClient.get<DatasetById>(url);
    }

    getModelValidation(): ModelValidation {
        const obj = JSON.parse('{"score":0.8, "example_count":50, "accuracy_score":0.98,"recall_score":0.98, "precision_score":0.98, "f1_score":0.98, "log_loss":0.048, "roc_auc":1.1}');
        return obj;
    }

    getModelValidationImg(): ModelValidation {
        const obj = JSON.parse('{"roc_curve_plot" : "https://cog-ui-test.s3.eu-west-3.amazonaws.com/confusion_matrix.png",' +
            '"precision_recall_curve_plot":"https://cog-ui-test.s3.eu-west-3.amazonaws.com/precision_recall_curve_plot.png"}');
        return obj;
    }
}

