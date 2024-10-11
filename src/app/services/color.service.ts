import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  // Define a signal for dark mode
  isDarkMode = signal<boolean>(false);

  darkTextPrimary = 'rgb(204,204,204)';
  darkBackgroundPrimary = 'rgb(34,34,34)';
  darkBackgroundSecondary = 'rgb(24,24,24)';

  lightTextPrimary = 'rgb(38,38,38)';
  lightTextSecondary = 'rgb(64,64,64)';
  lightTextTertiary = 'rgb(108,114,127)';

  lightBackgroundPrimary = 'rgb(255,255,255)';

  constructor() {
    this.detectColorScheme();
    this.listenForColorSchemeChanges();

    // Create an effect to log changes in the darkModeSignal
    effect(() => {
      console.log('Dark mode is', this.isDarkMode() ? 'enabled' : 'disabled');
    });
  }

  // Getter to expose the dark mode signal
  getIsDarkMode() {
    return this.isDarkMode;
  }

  private detectColorScheme(): void {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDarkMode.set(isDarkMode);
  }

  private listenForColorSchemeChanges(): void {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', (event) => {
      this.isDarkMode.set(event.matches);
    });
  }
}
