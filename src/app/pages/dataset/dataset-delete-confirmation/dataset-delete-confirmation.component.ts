import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Dataset } from '../../../model/DatasetInfo';

@Component({
  selector: 'app-dataset-delete-confirmation',
  templateUrl: './dataset-delete-confirmation.component.html',
  styleUrl: './dataset-delete-confirmation.component.scss',
})
export class DatasetDeleteConfirmationComponent {
  name: string = 'datasets';
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Dataset,
    public dialogRef: MatDialogRef<DatasetDeleteConfirmationComponent>,
  ) {}

  delete(): void {
    this.dialogRef.close({ data: this.data });
  }

  close(): void {
    this.dialogRef.close();
  }
}
