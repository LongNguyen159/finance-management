import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  private _snackBar = inject(MatSnackBar);
  constructor() { }


  showSnackBar(message: string, action: string = 'Dismiss', duration: number = 3000) {
    this._snackBar.open(message, action, {
      duration: duration
    });
  }
}
