import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {ModelInfo, ModelInfoById} from "../model/ModelInfo";
import {DatasetById} from "../model/DatasetInfo";
import {ModelDetailInfo} from "../model/ModelDetails";

@Injectable({
    providedIn: 'root'
})
export class CogFrameworkApiService {

    modeAPIURL = environment.appURL;

    constructor(private httpClient: HttpClient,) {
    }

    getModelByName(name: string): Observable<ModelInfo> {
        console.log('get Model...');
        const url = this.modeAPIURL + '/models/' + name
        return this.httpClient.get<ModelInfo>(url);
    }

    getModelById(id: string): Observable<ModelInfoById> {
        console.log('get Model...');
        const url = this.modeAPIURL + '/models/' + id
        return this.httpClient.get<ModelInfoById>(url);
    }

    getModelDetailById(id: string): Observable<ModelDetailInfo> {
        const url = this.modeAPIURL + '/model_details?id=' + id
        return this.httpClient.get<ModelDetailInfo>(url);
    }

    getModes(name: string): Observable<ModelInfo> {
        console.log('get Model...');
        const url = this.modeAPIURL + '/models'
        return this.httpClient.get<ModelInfo>(url);
    }

    // dataset apis

    getDatasetById(id: string): Observable<DatasetById> {
        console.log('get DatasetById...');
        const url = this.modeAPIURL + '/dataset/' + id
        return this.httpClient.get<DatasetById>(url);
    }
}
