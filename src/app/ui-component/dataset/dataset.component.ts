import {Component} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatTableModule} from "@angular/material/table";
import {environment} from "../../../environments/environment.development";
import {CogFrameworkApiService} from "../../service/cog-framework-api.service";
import {DatePipe, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {MatIconModule} from "@angular/material/icon";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatTooltipModule} from "@angular/material/tooltip";
import {DataSetData} from "../../model/DatasetInfo";
import {Router} from "@angular/router";

const ELEMENT_DATA: DataSetData[] = [];

@Component({
    selector: 'app-dataset',
    standalone: true,
    imports: [
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        DatePipe,
        FormsModule,
        MatIconModule,
        MatProgressBarModule,
        MatTooltipModule,
        NgIf
    ],
    templateUrl: './dataset.component.html',
    styleUrl: './dataset.component.scss'
})
export class DatasetComponent {

    loading = false;
    displayedColumns: string[] = ['id', 'name', 'creationTime', 'author', 'action'];
    dataSource = ELEMENT_DATA;
    appURL = environment.appURL;
    datasetName = "demo";
    datasetId = "";

    constructor(private cogFrameworkApiService: CogFrameworkApiService, private router: Router) {
    }

    open(item: any): void {
        this.router.navigate(['/dataset-detail'], {queryParams: {id: item.id}})
            .then(r => {
                console.log("redirected to other component")
            });
    }

    search(): void {
        if (this.datasetId.length > 0) {
            console.log("Search by ID")
            this.searchByID();
        } else {
            console.log("Search by Name")
            this.searchByName();
        }
    }

    searchByID(): void {
        this.loading = true;
        const response = this.cogFrameworkApiService.getDatasetById(this.datasetId);

        response.subscribe({
            next: (v) => {
                console.log(v)
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
        console.log("search dataset with name " + this.datasetName)
        const response = this.cogFrameworkApiService.getDataSetDetailByName(this.datasetName);
        response.subscribe({
            next: (v) => {
                console.log(v)
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
