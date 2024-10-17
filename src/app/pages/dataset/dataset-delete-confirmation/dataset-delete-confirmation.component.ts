import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Dataset } from '../../../model/DatasetInfo';

@Component({
  selector: 'app-dataset-delete-confirmation',
  templateUrl: './dataset-delete-confirmation.component.html',
  styleUrl: './dataset-delete-confirmation.component.scss',
})
export class DatasetDeleteConfirmationComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public dataSetData: Dataset,
    public dialogRef: MatDialogRef<DatasetDeleteConfirmationComponent>,
  ) {}

  deleteDataset(): void {
    this.dialogRef.close({ data: this.dataSetData });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
