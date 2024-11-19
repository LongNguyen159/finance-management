import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {version} from '../../package.json';
import { ColorService } from './services/color.service';
import { DataService } from './services/data.service';
import { RoutePath } from './components/models';
declare const window: any;


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatMenuModule, MatIconModule, MatButtonModule, RouterModule
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
    if (window['electronAPI']) {
      window['electronAPI'].onUpdateAvailable(() => {
        alert('Update available! Downloading now...');
      });
  
      window['electronAPI'].onUpdateDownloaded(() => {
        const restart = confirm('Update downloaded. Restart now?');
        if (restart) {
          window['electronAPI'].ipcRenderer.send('restart_app');
        }
      });
    } else {
      console.error('Electron object is not available. Ensure preload.js is correctly configured.');
    }
    // Fetch app version from package.json
    this.appVersion = version;

    // Check if it's the user's first time
    const isFirstTime = localStorage.getItem('firstTime') === null || localStorage.getItem('firstTime') === 'true';

    if (isFirstTime || this.dataService.isOldVersion()) {
      // Navigate to the welcome page and mark the user as not first-time
      this.navigateToWelcome();
    } else {
      // For non-first-time users, check for updates
      this.checkForUpdate();
    }
  }

  checkForUpdate() {
    const storedVersion = localStorage.getItem('appVersion');
    console.log('Stored version:', storedVersion);
    console.log('Current version pulled from package.json:', this.appVersion);
    if (!storedVersion || storedVersion !== this.appVersion) {
      // If the stored version is missing or different, show the update page
      this.router.navigate([RoutePath.WhatsNewPage]);
      
      // Store the new version to prevent showing the update page again
      localStorage.setItem('appVersion', this.appVersion);
    }
  }

  navigateToWelcome() {
    this.router.navigate([RoutePath.WelcomePage]);
    /** Set app version on welcome to prevent showing updates on next time. */
    localStorage.setItem('appVersion', this.appVersion);
    // Mark the user as having seen the welcome page
    localStorage.setItem('firstTime', 'false');
  }
}
