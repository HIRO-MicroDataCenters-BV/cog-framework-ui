import {Component} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatTabsModule} from "@angular/material/tabs";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatTableModule} from "@angular/material/table";

export interface ModelElement {
  id: number;
  name: string;
  creationTime: number;
  author: string;
}

const ELEMENT_DATA: ModelElement[] = [
  {id: 1, name: 'Model1', creationTime: 1.0079, author: 'Bola'},
  {id: 1, name: 'Model2', creationTime: 1.0079, author: 'Rui'},
  {id: 1, name: 'Model3', creationTime: 1.0079, author: 'Veena'},

];

@Component({
  selector: 'app-model',
  standalone: true,
  imports: [
    MatCardModule,
    MatTabsModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule
  ],
  templateUrl: './model.component.html',
  styleUrl: './model.component.scss'
})
export class ModelComponent {

  displayedColumns: string[] = ['id', 'name', 'creationTime', 'author', 'action'];
  dataSource = ELEMENT_DATA;
}
