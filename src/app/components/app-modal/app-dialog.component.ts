import { Component, Input, inject } from '@angular/core';
import { DIALOG_DATA, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { MatCardModule } from '@angular/material/card';
import {
  MatDialogActions,
  MatDialogContainer,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  AsyncPipe,
  NgForOf,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from '@angular/common';
import { DEF_DIALOG_ACTIONS } from 'src/app/constants';
import { ButtonItem } from 'src/app/model/General';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [
    DialogModule,
    MatCardModule,
    MatDialogModule,
    MatDialogContainer,
    MatDialogActions,
    MatButtonModule,
    TranslocoPipe,
    AsyncPipe,
    NgForOf,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
  ],
  templateUrl: './app-dialog.component.html',
  styleUrl: './app-dialog.component.scss',
})
export class AppDialogComponent {
  @Input() title: string | unknown = '';
  @Input() actions: ButtonItem[] = DEF_DIALOG_ACTIONS;

  data = inject(DIALOG_DATA);
  ref = inject<DialogRef<string>>(DialogRef<string>);

  action(type: string | undefined): void {
    console.log('type');
    this.ref.close(type);
  }
}
