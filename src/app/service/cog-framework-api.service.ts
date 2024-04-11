import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {Model, ModelInfo, ModelInfoById} from "../model/ModelInfo";

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

    getModes(name: string): Observable<ModelInfo> {
        console.log('get Model...');
        const url = this.modeAPIURL + '/models'
        return this.httpClient.get<ModelInfo>(url);

    }
}
