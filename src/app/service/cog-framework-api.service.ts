import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {ModelInfo} from "../model/ModelInfo";

@Injectable({
    providedIn: 'root'
})
export class CogFrameworkApiService {

    modeAPIURL = environment.appURL;

    constructor(private httpClient: HttpClient,) {
    }

    getModel(): Observable<ModelInfo> {
        console.log('get Model...');
        const url = this.modeAPIURL + '/models'
        return this.httpClient.get<ModelInfo>(url);

    }
}
