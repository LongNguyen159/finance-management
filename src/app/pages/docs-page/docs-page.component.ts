import { Component, inject } from '@angular/core';
import { UserManualComponent } from '../../components/user-manual/user-manual.component';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';

@Component({
  selector: 'app-docs-page',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatMenuModule,
    UserManualComponent, NavbarComponent, MatSnackBarModule],
  templateUrl: './docs-page.component.html',
  styleUrl: './docs-page.component.scss'
})
export class DocsPageComponent {
  private _snackBar = inject(MatSnackBar);


  clearLocalStorage() {
    localStorage.clear();
    this._snackBar.open('Local storage cleared', 'Dismiss', {
      duration: 2000,
    })
  }
}
