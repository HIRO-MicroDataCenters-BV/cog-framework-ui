import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  constructor(
    private snackBar: MatSnackBar,
    private translocoService: TranslocoService,
  ) {}

  openSnackBar(
    message: string,
    action: string = this.translocoService.translate('action.close'),
    options: MatSnackBarConfig<object> = {},
  ): void {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      ...options,
    });
  }
}
