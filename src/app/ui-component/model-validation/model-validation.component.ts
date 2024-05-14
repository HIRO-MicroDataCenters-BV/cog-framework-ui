import {Component} from '@angular/core';
import {CogFrameworkApiService} from "../../service/cog-framework-api.service";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatTableModule} from "@angular/material/table";
import {MatTooltipModule} from "@angular/material/tooltip";
import {DemoMaterialModule} from "../../demo-material-module";
import {NgOptimizedImage} from "@angular/common";

interface ModelValidationTable {
    name: String;
    value: Number;
}

@Component({
    selector: 'app-model-validation',
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatTooltipModule,
        DemoMaterialModule,
        NgOptimizedImage
    ],
    templateUrl: './model-validation.component.html',
    styleUrl: './model-validation.component.scss'
})
export class ModelValidationComponent {

    imageUrl0 = "http://127.0.0.1:5000/s/get_image?img=s3://mlflow/Screenshot_2024-04-09_at_14.51.19.png";
    imageUrl = "http://127.0.0.1:9000/mlflow/Screenshot 2024-04-23 at 02.15.46.png";
    imageUrl2 = "https://cog-ui-test.s3.eu-west-3.amazonaws.com/precision_recall_curve_plot.png";
    modelValidationScoreTableSource: ModelValidationTable[] = [];
    displayedColumns: string[] = ['name', 'value'];

    constructor(private cogFrameworkApiService: CogFrameworkApiService) {
        this.modeValidation();
        this.modeValidationImg();
    }

    modeValidation(): void {
        const data = this.cogFrameworkApiService.getModelValidation();
        this.modelValidationScoreTableSource.push({"name": "score", "value": data.score});
        this.modelValidationScoreTableSource.push({"name": "example_count", "value": data.example_count});
        this.modelValidationScoreTableSource.push({"name": "accuracy_score", "value": data.accuracy_score});
        this.modelValidationScoreTableSource.push({"name": "recall_score", "value": data.recall_score});
        this.modelValidationScoreTableSource.push({"name": "precision_score", "value": data.precision_score});
        this.modelValidationScoreTableSource.push({"name": "f1_score", "value": data.f1_score});
        this.modelValidationScoreTableSource.push({"name": "log_loss", "value": data.log_loss});
        this.modelValidationScoreTableSource.push({"name": "roc_auc", "value": data.roc_auc});
    }

    modeValidationImg(): void {
        const response = this.cogFrameworkApiService.getModelValidationImgv2();
        response.subscribe({
            next: (v) => {
                console.log(v)
            },
            error: (e) => {
                console.error(e)
            },
            complete: () => {
                console.info('complete')
            }
        })
    }

}
