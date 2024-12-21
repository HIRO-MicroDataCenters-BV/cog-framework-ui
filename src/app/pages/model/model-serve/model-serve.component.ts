import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Model } from '../../../model/ModelInfo';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModelServe } from '../../../model/ModelServe';

@Component({
  selector: 'app-model-serve',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './model-serve.component.html',
  styleUrl: './model-serve.component.scss',
})
export class ModelServeComponent {
  modelIsvcName: string | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public model: Model,
    public dialogRef: MatDialogRef<ModelServeComponent>,
  ) {}

  serveModel(): void {
    if (!this.modelIsvcName) {
      return;
    }
    const modelServe: ModelServe = {
      model_name: this.model.name,
      isvc_name: this.modelIsvcName,
      version: Number(this.model.version),
    };
    this.dialogRef.close({
      modelServeData: modelServe,
      model: this.model,
    });
  }
}
