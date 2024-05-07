import {Component} from '@angular/core';
import {CogFrameworkApiService} from "../../service/cog-framework-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatTableModule} from "@angular/material/table";
import {MatTooltipModule} from "@angular/material/tooltip";
import {NgIf} from "@angular/common";
import {
    DatasetData,
    DatasetFiles,
    DatasetFilesInfo,
    File,
    RelatedModel
} from "../../model/DataSetDetailInfo";

@Component({
    selector: 'app-dataset-detail',
    standalone: true,
    imports: [
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatTableModule,
        MatTooltipModule,
        NgIf
    ],
    templateUrl: './dataset-detail.component.html',
    styleUrl: './dataset-detail.component.scss'
})
export class DatasetDetailComponent {

    modelId = "1";
    dataSetDetail: DatasetData | undefined;

    dataSetFileDisplayedColumns: string[] = ['id', 'name', 'action'];
    displayedColumns: string[] = ['id', 'action'];
    dataSetFileDataSource: DatasetFilesInfo[] = [];

    dataSetRelatedModelsDataSource: RelatedModel[] = [];
    errMsg = undefined;

    constructor(private cogFrameworkApiService: CogFrameworkApiService, private activatedRoute: ActivatedRoute,
                private router: Router) {
        if (this.activatedRoute.snapshot.queryParams['id']) {
            this.modelId = this.activatedRoute.snapshot.queryParams['id'];
        }
        this.dataSetDetails();
    }

    dataSetDetails(): void {
        console.log("search dataSetDetails with id " + this.modelId)
        const response = this.cogFrameworkApiService.getDataSetDetailById(this.modelId);

        response.subscribe({
            next: (v) => {
                console.log(v)
                this.dataSetDetail = v.data.dataset_info;
                console.log(v.data.dataset_files)
                this.convertDataSetFileModel(v.data.dataset_files);
                // this.modelFileDataSource = v.data.model_files
                this.errMsg = undefined;
                this.dataSetRelatedModelsDataSource = v.data.related_model;
            },
            error: (e) => {
                console.log('error----->')
                console.error(e)
                console.error(e.status)
                console.error(e.error.error)
                if (e.status === 404) {
                    this.errMsg = e.error.error
                }
                // this.loading = false;
            },
            complete: () => {
                //this.loading = false;
                console.info('complete')
            }
        })
    }

    convertDataSetFileModel(datasetFiles: DatasetFiles): void {
        const datasetFilesInfo: DatasetFilesInfo[] = []
        console.log(datasetFiles)
        const files: File[] = datasetFiles.files;
        const tables: any[] = datasetFiles.tables;

        files.forEach(function (file) {
            const d: DatasetFilesInfo = {id: file.file_id, name: file.file_name}
            datasetFilesInfo.push(d)
        });

        tables.forEach(function (table) {
            const d: DatasetFilesInfo = {id: table.table_id, name: table.dburl}
            datasetFilesInfo.push(d)
        });

        this.dataSetFileDataSource = datasetFilesInfo;
    }

    back(): void {
        this.router.navigate(['/dataset'])
            .then(r => {
            });
    }
}
