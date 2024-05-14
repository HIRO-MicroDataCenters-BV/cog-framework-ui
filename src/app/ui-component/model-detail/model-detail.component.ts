import {Component} from '@angular/core';
import {CogFrameworkApiService} from "../../service/cog-framework-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatCardModule} from "@angular/material/card";
import {MatListModule} from "@angular/material/list";
import {DatasetInfo, ModelDetailInfo, ModelFileInfo} from "../../model/ModelDetails";
import {MatTableModule} from "@angular/material/table";
import {DemoMaterialModule} from "../../demo-material-module";
import {NgIf} from "@angular/common";


@Component({
    selector: 'app-model-detail',
    standalone: true,
    imports: [
        MatCardModule,
        MatListModule,
        MatTableModule,
        DemoMaterialModule,
        NgIf
    ],
    templateUrl: './model-detail.component.html',
    styleUrl: './model-detail.component.scss'
})
export class ModelDetailComponent {

    modelId = "1";
    modelDetail: ModelDetailInfo | undefined;

    displayedColumns: string[] = ['id', 'action'];
    dataSetDataSource: DatasetInfo[] = [];
    modelFileDataSource: ModelFileInfo[] = [];
    errMsg = undefined;

    constructor(private cogFrameworkApiService: CogFrameworkApiService, private activatedRoute: ActivatedRoute,
                private router: Router) {
        console.log(this.activatedRoute.snapshot.queryParams['id'])
        if (this.activatedRoute.snapshot.queryParams['id']) {
            this.modelId = this.activatedRoute.snapshot.queryParams['id'];
        }
        this.modeDetails();
    }

    modeDetails(): void {
        console.log("search model with name " + this.modelId)
        const response = this.cogFrameworkApiService.getModelDetailById(this.modelId);

        response.subscribe({
            next: (v) => {
                console.log(v)
                this.modelDetail = v;
                this.dataSetDataSource = v.data.datasets;
                this.modelFileDataSource = v.data.model_files
                this.errMsg = undefined;
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

    back(): void {
        this.router.navigate(['/model'])
            .then(r => {
            });
    }
}
