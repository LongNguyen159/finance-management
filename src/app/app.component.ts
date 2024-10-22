import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { InputListComponent } from './components/input-list/input-list.component';
import { NavbarComponent } from "./components/navbar/navbar.component";
import * as packageJson from '../../package.json';
import { ColorService } from './services/color.service';
import { DataService } from './services/data.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatMenuModule, MatIconModule, MatButtonModule, InputListComponent, RouterModule, NavbarComponent,
    NavbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Easy Sankey';
  appVersion = ''
  colorService = inject(ColorService)
  dataService = inject(DataService)
  constructor(private router: Router, renderer: Renderer2) {
    this.colorService.renderer = renderer;
    /** Retrieve theme from service to apply */
    this.colorService.applyStoredThemeSettings()
  }

  ngOnInit(): void {
    // Fetch app version from package.json
    this.appVersion = packageJson.version;

    // Check if it's the user's first time
    const isFirstTime = localStorage.getItem('firstTime') === null || localStorage.getItem('firstTime') === 'true';

    if (isFirstTime) {
      // Navigate to the welcome page and mark the user as not first-time
      this.navigateToWelcome();
    } else {
      // For non-first-time users, check for updates
      this.checkForUpdate();
    }
  }

  checkForUpdate() {
    const storedVersion = localStorage.getItem('appVersion');
    if (!storedVersion || storedVersion !== this.appVersion) {
      // If the stored version is missing or different, show the update page
      this.router.navigate(['/updates']);
      
      // Store the new version to prevent showing the update page again
      localStorage.setItem('appVersion', this.appVersion);
    }
  }

  navigateToWelcome() {
    this.router.navigate(['/welcome']);
    // Mark the user as having seen the welcome page
    localStorage.setItem('firstTime', 'false');
  }
}
