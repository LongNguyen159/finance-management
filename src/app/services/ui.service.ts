import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/dialogs/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})

/** Service that handles showing UI components like snackbar, confirm dialog, etc. to notify or prompt user. */
export class UiService {

  private _snackBar = inject(MatSnackBar);
  private _dialog = inject(MatDialog)
  constructor() { }


  showSnackBar(message: string, action: string = 'Dismiss', duration: number = 3000) {
    this._snackBar.open(message, action, {
      duration: duration
    });
  }


  /** Open confirm dialog with given data.
   * @param dialogData Data to be displayed in the dialog
   * @returns Observable<boolean> that emits true if confirmed, false if canceled.
   */
  openConfirmDialog(dialogData: ConfirmDialogData, width: string = '50vw', height: string = '14rem') {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      width: width,
      height: height,
      maxHeight: '80vh',
      data: dialogData
    });


    return dialogRef.afterClosed();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }


  scrollUpBy70vh() {
    const scrollAmount = Math.min(window.innerHeight * 0.80, 800);
    window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
  }

  scrollDownBy70vh() {
    const scrollAmount = Math.min(window.innerHeight * 0.80, 800);
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  }
}
