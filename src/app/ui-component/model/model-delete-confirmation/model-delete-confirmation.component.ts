import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Model } from '../../../model/ModelInfo';

@Component({
  selector: 'app-model-delete-confirmation',
  templateUrl: './model-delete-confirmation.component.html',
  styleUrls: ['./model-delete-confirmation.component.scss'],
})
export class ModelDeleteConfirmationComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public model: Model,
    public dialogRef: MatDialogRef<ModelDeleteConfirmationComponent>,
  ) {}

  deleteModel(): void {
    this.dialogRef.close({ data: this.model });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    console.log('ngOnInit');
  }
}
