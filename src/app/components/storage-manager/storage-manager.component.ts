import { ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ColorService } from '../../services/color.service';
import { UiService } from '../../services/ui.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogData } from '../dialogs/confirm-dialog/confirm-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { parseLocaleStringToNumber, sortYearsDescending } from '../../utils/utils';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { TotalSurplusLineChartComponent } from "../charts/total-surplus-line-chart/total-surplus-line-chart.component";
import { takeUntil } from 'rxjs';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { MatButtonModule } from '@angular/material/button';
import { MainPageDialogComponent } from '../dialogs/main-page-dialog/main-page-dialog.component';

@Component({
  selector: 'app-storage-manager',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, CommonModule, MatIconModule, MatExpansionModule,
    MatSelectModule, NgxEchartsDirective, TotalSurplusLineChartComponent, MatButtonModule],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './storage-manager.component.html',
  styleUrl: './storage-manager.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Default
})
export class StorageManagerComponent extends BasePageComponent implements OnInit{
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
    { value: 'whole-year', label: 'This Year' },
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

    /** Refresh data if input changes */
    this.dataService.isDataSaved().pipe(takeUntil(this.componentDestroyed$)).subscribe(isSaved => {
      if (isSaved) {
        this.refreshData()
        this.filterMonths()
      }
    })
  }

  refreshData() {
    this.localStorageData = this.dataService.getMonthlyDataFromLocalStorage();
    this.storedMonths = Object.keys(this.localStorageData);
  }

  getStoredYears(): string[] {
    const years = Object.keys(this.localStorageData).map(month => month.split('-')[0]);
    const sortedYears = sortYearsDescending(Array.from(new Set(years))); 
    return sortedYears
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
      this.allFilteredMonths = Object.values(storedMonthsAllYears).flat();
      this.populateSurplusChartData(this.allFilteredMonths);
      return;
    }
  
    // Update: Handle 'whole-year' to show all months of the current year
    if (this.selectedOption === 'whole-year') {
      // Only show months for the current year
      this.filteredMonthsByYear[currentYear] = storedMonthsAllYears[currentYear] || [];
      this.allFilteredMonths = this.filteredMonthsByYear[currentYear];
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
      this.populateSurplusChartData(this.allFilteredMonths); // Populate chart data based on the filtered months
    }
  }

  /** Trigger filtering when a new option is selected from the dropdown */
  onOptionSelected() {
    this.filterMonths(); // Filter the months based on selected option
  }


  populateSurplusChartData(allMonths: string[] = []) {
    const filteredData = Object.entries(this.localStorageData)
      .filter(([month]) => allMonths.includes(month))
      .map(([month, value]) => ({
        month,
        surplus: parseLocaleStringToNumber(value.remainingBalance) || 0,
      }));
  
    // Sort the filtered data by month in chronological order
    this.surplusChartData = filteredData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  
    console.log('chart data: ', this.surplusChartData);
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
    const dialogData: ConfirmDialogData = {
      title: `Are you sure you want to delete ${key}?`,
      message: `This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmColor: 'warn'
    }

    this.uiService.openConfirmDialog(dialogData).subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        this.dataService.removeMonthFromLocalStorage(key);
        this.uiService.showSnackBar(`"${key}" removed from local storage`);
        this.refreshData();
        this.filterMonths(); // Re-filter after removal
      }
    })
  }

  /** This function is used to get details of the corresponding month. 
   * @param month: string in YYYY-MM format.
   */
  getMonthsDetails(month: string) {
    this.dialog.open(MainPageDialogComponent, {
      data: this.localStorageData[month],
      width: '80vw',
      height: '80vh',
      maxWidth: '90vw',
      maxHeight: '90vh',
    })
    
  }
}
