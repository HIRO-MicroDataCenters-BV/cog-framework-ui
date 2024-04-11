import {Component} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatTabsModule} from "@angular/material/tabs";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatTableModule} from "@angular/material/table";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {environment} from "../../../environments/environment.development";
import {FormsModule} from "@angular/forms";
import {CogFrameworkApiService} from "../../service/cog-framework-api.service";
import {Model} from 'src/app/model/ModelInfo';
import {DatePipe, NgIf} from "@angular/common";
import {MatProgressBarModule} from "@angular/material/progress-bar";


const ELEMENT_DATA: Model[] = [];

@Component({
    selector: 'app-model',
    standalone: true,
    imports: [
        MatCardModule,
        MatTabsModule,
        MatInputModule,
        MatButtonModule,
        MatTableModule,
        MatIconModule,
        MatTooltipModule,
        FormsModule,
        NgIf,
        DatePipe,
        MatProgressBarModule
    ],
    templateUrl: './model.component.html',
    styleUrl: './model.component.scss'
})
export class ModelComponent {

    loading = false;
    displayedColumns: string[] = ['id', 'name', 'creationTime', 'author', 'action'];
    dataSource = ELEMENT_DATA;
    appURL = environment.appURL;
    modelName = "Federated Learning";
    modelId = "1";

    constructor(private cogFrameworkApiService: CogFrameworkApiService) {
    }

    open(item: any): void {
        console.log("add open")
    }

    search(): void {
        this.searchByID();
    }

    searchByID(): void {
        this.loading = true;
        console.log("search model with name " + this.modelName)
        const response = this.cogFrameworkApiService.getModelById(this.modelId);

        response.subscribe({
            next: (v) => {
                console.log("----")
                console.log(v)
                console.log(v)
                console.log("----")
                const model = [];
                model.push(v.data);
                this.dataSource = model;
            },
            error: (e) => {
                console.error(e)
                this.loading = false;
            },
            complete: () => {
                this.loading = false;
                console.info('complete')
            }
        })
    }

    searchByName(): void {
        this.loading = true;
        console.log("search model with name " + this.modelName)
        const response = this.cogFrameworkApiService.getModelByName(this.modelName);
        response.subscribe({
            next: (v) => {
                console.log("----")
                console.log(v)
                console.log(v.data)
                console.log("----")
                this.dataSource = v.data;
            },
            error: (e) => {
                console.error(e)
                this.loading = false;
            },
            complete: () => {
                this.loading = false;
                console.info('complete')
            }
        })
    }
}
