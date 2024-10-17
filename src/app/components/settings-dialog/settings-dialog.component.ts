import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {MatRadioModule} from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorService, Theme } from '../../services/color.service';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatCardModule,
    MatRadioModule, CommonModule, FormsModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss'
})
export class SettingsDialogComponent implements OnInit{
  colorService = inject(ColorService)
  /** 'system', 'light' or 'dark' */
  selectedTheme: Theme = Theme.System;
  theme = Theme

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.selectedTheme = this.colorService.isManualThemeSet() ? (this.colorService.isDarkMode() ? Theme.Dark : Theme.Light) : Theme.System
    this.applySelectedTheme(this.selectedTheme);
  }

  /** On selection change, call apply theme */
  applySelectedTheme(theme: Theme) {
    this.colorService.applyTheme(theme);
    console.log('isManual theme set:', this.colorService.isManualThemeSet())
  }
}
