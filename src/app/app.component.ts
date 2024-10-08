import { Component, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { InputListComponent } from './components/input-list/input-list.component';
import { NavbarComponent } from "./components/navbar/navbar.component";
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatMenuModule, MatIconModule, MatButtonModule, InputListComponent, RouterModule, NavbarComponent,
    NavbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Easy Sankey';
  constructor(private router: Router) {
    if (localStorage.getItem('firstTime') === null || localStorage.getItem('firstTime') === 'true') {
      localStorage.setItem('firstTime', 'true');
      this.navigateToWelcome()
    }
  }

  navigateToWelcome() {
    this.router.navigate(['/welcome']);
    localStorage.setItem('firstTime', 'false');
  }
}
