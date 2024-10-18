import { DOCUMENT } from '@angular/common';
import { Injectable, signal, effect, Renderer2, Inject, inject } from '@angular/core';


export enum Theme {
  Light = 'light',
  Dark = 'dark',
  System = 'system'
}
@Injectable({
  providedIn: 'root'
})
export class ColorService {
  renderer: Renderer2
  // Define a signal for dark mode
  isDarkMode = signal<boolean>(false);
  isManualThemeSet = signal<boolean>(false);

  selectedTheme: string = 'system';

  darkTextPrimary = 'rgb(204,204,204)';
  darkBackgroundPrimary = 'rgb(34,34,34)';
  darkBackgroundSecondary = 'rgb(24,24,24)';

  lightTextPrimary = 'rgb(38,38,38)';
  lightTextSecondary = 'rgb(64,64,64)';
  lightTextTertiary = 'rgb(108,114,127)';

  lightBackgroundPrimary = 'rgb(255,255,255)';

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.listenForColorSchemeChanges();

    // Create an effect to log changes in the darkModeSignal
    effect(() => {
      console.log('Dark mode is', this.isDarkMode() ? 'enabled' : 'disabled');
    });
  }


  /** Retrive stored theme settings from LocalStorage to apply on app init.
   * If no settigs are found, apply system's theme.
   */
  applyStoredThemeSettings(): void {
    const settings = localStorage.getItem('themeSettings');
    if (settings) {
      const { isDarkMode, isManualThemeSet, selectedTheme } = JSON.parse(settings);
      /** Set signals */
      this.isDarkMode.set(isDarkMode);
      this.isManualThemeSet.set(isManualThemeSet);
      this.selectedTheme = selectedTheme;

      // Apply the loaded theme settings
      if (isManualThemeSet) {
        this.isDarkMode.set(isDarkMode); // Set dark mode based on saved settings
        this.applyTheme(isDarkMode ? Theme.Dark : Theme.Light);
      } else {
        this.detectAndApplySystemTheme(); // Determine the dark mode based on system preference
      }
    } else {
      this.detectAndApplySystemTheme()
    }
  }


  /** Apply the theme. Available themes are:
   * - 'light': Light theme
   * - 'dark': Dark theme
   * - 'system': System theme
   */
  applyTheme(theme: Theme) {
    const htmlElement = document.documentElement;

    // Remove existing theme classes
    this.renderer.removeClass(htmlElement, 'light-theme');
    this.renderer.removeClass(htmlElement, 'dark-theme');

    if (theme === Theme.Light) {
        this.renderer.addClass(htmlElement, 'light-theme');
        this._setManualTheme(false);
    } else if (theme === Theme.Dark) {
        this.renderer.addClass(htmlElement, 'dark-theme');
        this._setManualTheme(true);
    } else {
        // For 'system', rely on media query behavior
        this._setSystemTheme()
    }
  }


  private _setManualTheme(isDark: boolean) {
    this.isDarkMode.set(isDark);
    this.isManualThemeSet.set(true); // Mark that a manual theme is set
    this.selectedTheme = 'manual'; // Track manual theme
    this._saveThemeSettings(); // Save to LocalStorage
  }

  private _setSystemTheme() {
    this.isManualThemeSet.set(false); // Reset manual theme state
    this.selectedTheme = 'system'; // Track system theme
    this.detectAndApplySystemTheme(); // Check the system's color scheme
    this._saveThemeSettings(); // Save to LocalStorage
  }

  private _saveThemeSettings(): void {
    const settings = {
      isDarkMode: this.isDarkMode(),
      isManualThemeSet: this.isManualThemeSet(),
      selectedTheme: this.selectedTheme // Save selected theme
    };
    localStorage.setItem('themeSettings', JSON.stringify(settings));
  }


  detectAndApplySystemTheme(): void {
    // Only detect the color scheme if no manual theme is set
    if (!this.isManualThemeSet()) {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(isDarkMode);
    }
  }

  private listenForColorSchemeChanges(): void {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', (event) => {
      if (!this.isManualThemeSet()) {
        this.isDarkMode.set(event.matches);
      }
    });
  }
}
