import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { parseLocaleStringToNumber } from '../../utils/utils';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { TotalSurplusLineChartComponent } from "../charts/total-surplus-line-chart/total-surplus-line-chart.component";

@Component({
  selector: 'app-storage-manager',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, CommonModule, MatIconModule, MatExpansionModule,
    MatSelectModule, NgxEchartsDirective, TotalSurplusLineChartComponent],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './storage-manager.component.html',
  styleUrl: './storage-manager.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class StorageManagerComponent implements OnInit{
  dataService = inject(DataService);
  colorService = inject(ColorService);
  uiService = inject(UiService);
  dialog = inject(MatDialog);
  localStorageData: { [key: string]: any } = {};
  storedMonths: string[] = [];
  storedYears: string[] = [];
  selectedYear: string = '';
  selectedOption: string = '3-months'; // Default selection for the dropdown

  availableOptions: { value: string, label: string }[] = [
    { value: '3-months', label: 'Last 3 months' },
    { value: '6-months', label: 'Last 6 months' },
    { value: '12-months', label: 'Last 12 months' },
    { value: 'whole-year', label: 'Current Year' },
    { value: 'show-all', label: 'All time' }
  ];

  currentDate = new Date();
  
  filteredMonthsByYear: { [key: string]: string[] } = {};
  allFilteredMonths: string[] = [];
  surplusChartData: { month: string; surplus: number }[] = [];


  ngOnInit(): void {
    this.refreshData();
    this.storedYears = this.getStoredYears();
    this.filterMonths(); // Initially filter based on the default option

    /** Sole purpose is to expand the panel if it matches the selected year in date picker */
    this.selectedYear = this.dataService.selectedActiveDate.getFullYear().toString();
  }

  refreshData() {
    this.localStorageData = this.dataService.getMonthlyDataFromLocalStorage();
    this.storedMonths = Object.keys(this.localStorageData);
  }

  getStoredYears(): string[] {
    const years = Object.keys(this.localStorageData).map(month => month.split('-')[0]);
    return Array.from(new Set(years)); // Get unique years
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

  /** This method filters the months based on the selected timeframe */
  filterMonths() {
    const storedMonthsAllYears = this.getStoredMonths();
    this.filteredMonthsByYear = {}; // Clear previous filters
    this.allFilteredMonths = []; // Clear previous month strings
    
    // Get current date for reference
    const currentYear = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
    // Handle 'show-all' case
    if (this.selectedOption === 'show-all') {
      this.filteredMonthsByYear = storedMonthsAllYears;
      this.allFilteredMonths = Object.values(storedMonthsAllYears).flat().sort();
      this.populateSurplusChartData(this.allFilteredMonths);
      return;
    }
  
    // Update: Handle 'whole-year' to show all months of the current year
    if (this.selectedOption === 'whole-year') {
      // Only show months for the current year
      this.filteredMonthsByYear[currentYear] = storedMonthsAllYears[currentYear] || [];
      this.allFilteredMonths = this.filteredMonthsByYear[currentYear].sort();
      this.populateSurplusChartData(this.allFilteredMonths);
      return; // Exit early since we're done filtering for this case
    }
  
    // Calculate date range based on the selected option
    const monthsToShow = this.selectedOption === '3-months' ? 3 :
                         this.selectedOption === '6-months' ? 6 :
                         this.selectedOption === '12-months' ? 12 : 12;
  
    for (const year of Object.keys(storedMonthsAllYears)) {
      const months = storedMonthsAllYears[year];
      const monthsToDisplay = [];
  
      // Loop through months and check if they fall within the selected date range
      for (const month of months) {
        const [monthYear, monthNumber] = month.split('-').map(Number);
  
        // Calculate the difference in months between the current date and this month
        const monthsDiff = (currentYear - monthYear) * 12 + (currentMonth - monthNumber);
  
        // If the difference is within the selected number of months, include it
        if (monthsDiff >= 0 && monthsDiff < monthsToShow) {
          monthsToDisplay.push(month);
          this.allFilteredMonths.push(month);
        }
      }
  
      // Only add the filtered months to the result if there are any
      if (monthsToDisplay.length > 0) {
        this.filteredMonthsByYear[year] = monthsToDisplay;
      }
      this.populateSurplusChartData(this.allFilteredMonths.sort()); // Populate chart data based on the filtered months
    }
  }

  /** Trigger filtering when a new option is selected from the dropdown */
  onOptionSelected() {
    this.filterMonths(); // Filter the months based on selected option
  }


  populateSurplusChartData(allMonths: string[] = []) {
    const filteredObject = Object.fromEntries(
      Object.entries(this.localStorageData).filter(([key]) => allMonths.includes(key))
    );

    this.surplusChartData = Object.entries(filteredObject).map(([key, value]) => {
      const month = key;
      const surplus = parseLocaleStringToNumber(value.remainingBalance) || 0;
      return { month, surplus }
    })

    console.log('chart data: ',this.surplusChartData);
  }

  calculateTotalSurplus(year: string): number {
    let totalSurplus = 0;
    const months = this.filteredMonthsByYear[year]; // Use filtered months

    if (months) {
      for (const month of months) {
        const balanceString: string = this.localStorageData[month].remainingBalance || '0';
        const numericBalance: number = parseLocaleStringToNumber(balanceString);
        totalSurplus += isNaN(numericBalance) ? 0 : numericBalance;
      }
    }
    return totalSurplus;
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
        this.filterMonths(); // Re-filter after removal
      }
    });
  }
}
