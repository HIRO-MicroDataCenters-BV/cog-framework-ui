import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Dataset } from '../../../model/DatasetInfo';

@Component({
  selector: 'app-dataset-delete-confirmation',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './dataset-delete-confirmation.component.html',
  styleUrl: './dataset-delete-confirmation.component.scss',
})
export class DatasetDeleteConfirmationComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public dataSetData: Dataset,
    public dialogRef: MatDialogRef<DatasetDeleteConfirmationComponent>,
  ) {}

  ngOnInit(): void {}

  deleteModel(): void {
    this.dialogRef.close({ data: this.dataSetData });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
