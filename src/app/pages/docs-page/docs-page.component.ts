import { Component } from '@angular/core';
import { UserManualComponent } from '../../components/user-manual/user-manual.component';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-docs-page',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatMenuModule,
    UserManualComponent, NavbarComponent],
  templateUrl: './docs-page.component.html',
  styleUrl: './docs-page.component.scss'
})
export class DocsPageComponent {


  clearLocalStorage() {
    localStorage.clear();
  }
}
