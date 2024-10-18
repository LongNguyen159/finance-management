import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ColorService } from '../../services/color.service';

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
    for (const month in this.localStorageData) {
      const year = month.split('-')[0];
      if (!monthsByYear[year]) {
        monthsByYear[year] = [];
      }
      monthsByYear[year].push(month);
    }
    return monthsByYear;
  }


  removeItem(key: string) {
    this.dataService.removeLocalStorageItem(key);
    this.refreshData();
  }

}
