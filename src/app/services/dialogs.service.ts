import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DidYouKnowDialogComponent } from '../components/dialogs/did-you-know-dialog/did-you-know-dialog.component';
import { SettingsDialogComponent } from '../components/dialogs/settings-dialog/settings-dialog.component';
import { InputListDialogComponent } from '../components/dialogs/input-list-dialog/input-list-dialog.component';
import { InsertExpenseDialogComponent } from '../components/dialogs/insert-expense-dialog/insert-expense-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogsService {
  readonly dialog = inject(MatDialog)
  constructor() { }



  openDidYouKnowDialog() {
    this.dialog.open(DidYouKnowDialogComponent);
  }

  openSettingsDialog() {
    this.dialog.open(SettingsDialogComponent, {
        width: '45rem',
        maxWidth: '60vw',
        height: '35rem',
        maxHeight: '90vh',
    })
  }


  openInsertIntoDialog(entryToModify: {name: string, value: number} ) {
    this.dialog.open(InsertExpenseDialogComponent, {
        width: '40rem',
        maxWidth: '60vw',
        // minHeight: '23rem',
        // height: '27rem',
        // maxHeight: '90vh',
        data: entryToModify
    })
  }

  


  openInputListDialog() {
      const dialogRef = this.dialog.open(InputListDialogComponent, {
          width: '75rem',
          height: '83vh',
          maxHeight: '90vh',
          maxWidth: '90vw',
          disableClose: false
      });
  }
}
