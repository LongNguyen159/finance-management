import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ColorService } from '../../services/color.service';
import { UiService } from '../../services/ui.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-storage-manager',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, CommonModule, MatIconModule, MatExpansionModule],
  templateUrl: './storage-manager.component.html',
  styleUrl: './storage-manager.component.scss'
})
export class StorageManagerComponent implements OnInit{
  dataService = inject(DataService)
  colorService = inject(ColorService)
  uiService = inject(UiService)
  dialog = inject(MatDialog)
  localStorageData: { [key: string]: any } = {};
  storedMonths: string[] = [];
  storedYears: string[] = [];

  ngOnInit(): void {
    this.refreshData();
    this.storedYears = this.getStoredYears();
  }

  refreshData() {
    this.localStorageData = this.dataService.getMonthlyDataFromLocalStorage();
    console.log('localStorageData', this.localStorageData);
    this.storedMonths = Object.keys(this.localStorageData);
  }


  getStoredYears(): string[] {
    const years = Object.keys(this.localStorageData).map(month => month.split('-')[0]);
    return Array.from(new Set(years)); // Remove duplicates
  }

  getStoredMonths(): { [key: string]: string[] } {
    const monthsByYear: { [key: string]: string[] } = {};
  
    // Iterate over the months stored in localStorageData
    for (const month in this.localStorageData) {
      const year = month.split('-')[0];
  
      // Initialize the year key if it doesn't exist
      if (!monthsByYear[year]) {
        monthsByYear[year] = [];
      }
  
      // Push the month to the respective year array
      monthsByYear[year].push(month);
    }
  
    // Sort each year's months in reverse chronological order (newest first)
    for (const year in monthsByYear) {
      monthsByYear[year].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }
  
    return monthsByYear;
  }


  removeItem(key: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '50vw',
      height: '14rem',
      data: { key }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataService.removeMonthFromLocalStorage(key);
        this.uiService.showSnackBar(`"${key}" removed from local storage`);
        this.refreshData();
      }
    });
  }

}
