import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DidYouKnowDialogComponent } from '../components/dialogs/did-you-know-dialog/did-you-know-dialog.component';
import { SettingsDialogComponent } from '../components/dialogs/settings-dialog/settings-dialog.component';
import { InputListDialogComponent } from '../components/dialogs/input-list-dialog/input-list-dialog.component';
import { StorageDialogComponent } from '../components/dialogs/storage-dialog/storage-dialog.component';

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
        width: '50rem',
        maxWidth: '80vw',
        height: '35rem',
        maxHeight: '90vh',
    })
  }

  openStorageDialog() {
    this.dialog.open(StorageDialogComponent, {
        width: '60rem',
        maxWidth: '80vw',
        height: '35rem',
        maxHeight: '90vh',
    })
  }


  openInputListDialog() {
      const dialogRef = this.dialog.open(InputListDialogComponent, {
          width: '75rem',
          height: '40rem',
          maxHeight: '90vh',
          maxWidth: '90vw',
          disableClose: false
      });
  }
}
