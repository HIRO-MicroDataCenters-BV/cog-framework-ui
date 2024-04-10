import {Component} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatTableModule} from "@angular/material/table";

export interface DataSetElement {
    id: number;
    name: string;
    creationTime: number;
    author: string;
}

const ELEMENT_DATA: DataSetElement[] = [
    {id: 1, name: 'Model1', creationTime: 1.0079, author: 'Bola'},
    {id: 1, name: 'Model2', creationTime: 1.0079, author: 'Rui'},
    {id: 1, name: 'Model3', creationTime: 1.0079, author: 'Veena'},

];

@Component({
    selector: 'app-dataset',
    standalone: true,
    imports: [
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule
    ],
    templateUrl: './dataset.component.html',
    styleUrl: './dataset.component.scss'
})
export class DatasetComponent {

    displayedColumns: string[] = ['id', 'name', 'creationTime', 'author', 'action'];
    dataSource = ELEMENT_DATA;

}
