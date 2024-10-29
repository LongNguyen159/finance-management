import { Component, inject, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {MatRadioModule} from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorService, Theme } from '../../../services/color.service';
import { DataService } from '../../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { UiService } from '../../../services/ui.service';
import { ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';



@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatCardModule,
    MatRadioModule, CommonModule, FormsModule, MatIconModule,
    RouterModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SettingsDialogComponent implements OnInit{
  colorService = inject(ColorService)
  dataService = inject(DataService)
  readonly router = inject(Router)
  dialogRef = inject(MatDialogRef);
  /** 'system', 'light' or 'dark' */
  selectedTheme: Theme = Theme.System;
  theme = Theme
  uiService = inject(UiService)

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.selectedTheme = this.colorService.isManualThemeSet() ? (this.colorService.isDarkMode() ? Theme.Dark : Theme.Light) : Theme.System
    this.applySelectedTheme(this.selectedTheme);
  }

  /** On selection change, call apply theme */
  applySelectedTheme(theme: Theme) {
    this.colorService.applyTheme(theme);
  }

  navigateToDataManager() {
    if (this.router.url === '/storage') {
      this.uiService.showSnackBar('Already in Finance Manager', 'Dismiss', 3000)
      return;
    }
    this.router.navigate(['/storage']);
    this.dialogRef.close()
  }
  clearLocalStorage() {
    const dialogData: ConfirmDialogData = {
      title: 'Are you sure you want to clear Local Storage?',
      message: 'This will delete all your data. You will see the welcome screen next time you open the app.',
      confirmLabel: 'Delete',
      confirmColor: 'warn',
      cancelLabel: 'Cancel'
    }
    this.uiService.openConfirmDialog(dialogData).subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        localStorage.clear();
        this.uiService.showSnackBar('Local Storage Cleared!', 'Dismiss', 3000)
      }
    })
  }
}
