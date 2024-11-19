import { Component, inject, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RestartDialogComponent } from '../restart-dialog/restart-dialog.component';
import { CurrencyService } from '../../../services/currency.service';
import { RoutePath } from '../../models';


@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatCardModule,
    MatRadioModule, CommonModule, FormsModule, MatIconModule,
    RouterModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SettingsDialogComponent implements OnInit{
  colorService = inject(ColorService)
  dataService = inject(DataService)
  currencyService = inject(CurrencyService)
  readonly router = inject(Router)
  dialogRef = inject(MatDialogRef);
  readonly dialog = inject(MatDialog)
  /** 'system', 'light' or 'dark' */
  selectedTheme: Theme = Theme.System;
  theme = Theme
  uiService = inject(UiService)

  selectedCurrency = ''
  availableCurrencies: string[] = ['USD', 'EUR', 'VND'];


  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.selectedTheme = this.colorService.isManualThemeSet() ? (this.colorService.isDarkMode() ? Theme.Dark : Theme.Light) : Theme.System
    this.applySelectedTheme(this.selectedTheme);


    this.selectedCurrency = this.currencyService.getSelectedCurrency();
    this.applySelectedCurrency(this.selectedCurrency)
  }

  /** On selection change, call apply theme */
  applySelectedTheme(theme: Theme) {
    this.colorService.applyTheme(theme);
    this.selectedTheme = theme;
  }


  applySelectedCurrency(currency: string): void {
    this.selectedCurrency = currency;
    this.currencyService.setSelectedCurrency(currency);
  }

  navigateToDataManager() {
    if (this.router.url === RoutePath.FinanceManagerPage) {
      this.uiService.showSnackBar('Already in Finance Manager', 'Dismiss', 3000)
      return;
    }
    this.router.navigate([RoutePath.FinanceManagerPage]);
    this.dialogRef.close()
  }
  clearLocalStorage() {
    const dialogData: ConfirmDialogData = {
      title: 'Are you sure you want to clear Local Storage?',
      message: 'This will erase all your data. You will see the welcome screen next time you open the app.',
      confirmLabel: 'Delete',
      confirmColor: 'warn',
      cancelLabel: 'Cancel'
    }
    this.uiService.openConfirmDialog(dialogData).subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        localStorage.clear();
        sessionStorage.clear();
        this.uiService.showSnackBar('Local Storage Cleared!', 'Dismiss', 3000)
        this.dialog.open(RestartDialogComponent, {
          disableClose: true,
          width: '45rem',
          maxWidth: '60vw',
          height: '12rem',
          maxHeight: '60vh',
        })
        this.dialogRef.close()
      }
    })
  }
}
