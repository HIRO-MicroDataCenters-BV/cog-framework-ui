import { Component } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { CogFrameworkApiService } from "../../service/cog-framework-api.service";
import { DatePipe, NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DataSetData } from "../../model/DatasetInfo";
import { FileInputComponent } from "../file-input/file-input.component";

const ELEMENT_DATA: DataSetData[] = [];

@Component({
    selector: 'upload-dataset',
    standalone: true,
    imports: [
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        DatePipe,
        FormsModule,
        MatIconModule,
        MatProgressBarModule,
        MatTooltipModule,
        NgIf,
        FileInputComponent
    ],
    templateUrl: './dataset-upload.component.html',
    styleUrl: './dataset-upload.component.scss',
})
export class UploadDatasetComponent {


    handleFileInput(file: File) {
        console.log(file);
    }



}
