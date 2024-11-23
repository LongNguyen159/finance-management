import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataService } from '../../services/data.service';
import { MonthlyData, SurplusBalanceLineChartData } from '../models';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ColorService } from '../../services/color.service';
import { UiService } from '../../services/ui.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogData } from '../dialogs/confirm-dialog/confirm-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { formatBigNumber, parseLocaleStringToNumber, removeSystemPrefix, sortYearsDescending } from '../../utils/utils';
import { TotalSurplusLineChartComponent } from "../charts/total-surplus-line-chart/total-surplus-line-chart.component";
import { takeUntil } from 'rxjs';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { MatButtonModule } from '@angular/material/button';
import { MainPageDialogComponent } from '../dialogs/main-page-dialog/main-page-dialog.component';
import { EntryType, PieData } from '../models';
import { IncomeExpenseRatioChartComponent } from "../charts/income-expense-ratio-chart/income-expense-ratio-chart.component";
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyService } from '../../services/currency.service';
import { MatMenuModule } from '@angular/material/menu';
import { TreemapChartComponent } from "../charts/treemap-chart/treemap-chart.component";

@Component({
  selector: 'app-storage-manager',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, CommonModule, MatExpansionModule,
    MatSelectModule, TotalSurplusLineChartComponent, MatButtonModule, IncomeExpenseRatioChartComponent,
    MatCardModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatMenuModule, TreemapChartComponent],
  providers: [CurrencyPipe],
  templateUrl: './storage-manager.component.html',
  styleUrl: './storage-manager.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Default
})
export class StorageManagerComponent extends BasePageComponent implements OnInit {
  dataService = inject(DataService);
  colorService = inject(ColorService);
  uiService = inject(UiService);
  dialog = inject(MatDialog);
  currencyPipe = inject(CurrencyPipe);
  currencyService = inject(CurrencyService);

  /** Months data stored in local storage */
  localStorageData: MonthlyData = {};

  /** Extract stored months and years */
  storedMonths: string[] = [];
  storedYears: string[] = [];

  /** Explained in ngOnInit. */
  selectedYear: string = '';

  selectedOption: string = '3-months'; // Default selection for the dropdown
  
  entryTypeEnums = EntryType;

  /** Display settings.
   * Format big numbers: Whether to format large numbers with K, M, B (minimum value: 10K)
   * Scale bar chart: Whether to scale the bar chart across all months to have the same xAxis for visual comparison.
   */
  isFormatBigNumbers: boolean = false;
  isBarChartScaled: boolean = true;

  /** Available time frame options for the dropdown menu */
  availableOptions: { value: string, label: string }[] = [
    { value: '3-months', label: 'Last 3 months' },
    { value: '6-months', label: 'Last 6 months' },
    { value: '12-months', label: 'Last 12 months' },
    { value: 'whole-year', label: 'This Year' },
    { value: '2-years', label: '2 Years' },
    { value: 'show-all', label: 'All time' }
  ];

  /** Get today's Date */
  currentDate = new Date();
  
  filteredMonthsByYear: { [key: string]: string[] } = {};

  /** Store filtered month strings in YYYY-MM format */
  allFilteredMonths: string[] = [];

  /** Chart data to plot the surplus and balance of each month  */
  surplusChartData: SurplusBalanceLineChartData[] = [];

  // private monthInfoCache: { [key: string]: { name: string, type: string, value: number }[] } = {};


  ngOnInit(): void {
    this.refreshData();
    this.loadFormatBigNumbersState();
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

  loadFormatBigNumbersState(): void {
    const savedState = sessionStorage.getItem('isFormatBigNumbers');
    this.isFormatBigNumbers = savedState === 'true';
  }

  saveFormatBigNumbersState(): void {
    sessionStorage.setItem('isFormatBigNumbers', this.isFormatBigNumbers.toString());
  }

  toggleFormatBigNumbers(): void {
    this.isFormatBigNumbers = !this.isFormatBigNumbers;
    this.saveFormatBigNumbersState();
  }

  toggleScaleBarChart() {
    this.isBarChartScaled = !this.isBarChartScaled;
    this.getScaleValue();
  }


  /** Find largest value (of either total income or total expenses) of given months.
   * This will be used later as a scale factor.
   * 
   * We will display an 'invisible' bar that has this value to make all the bars to have the same scale (same xAxis length)
   */
  private findLargestValue(data: { [key: string]: any }) {
    let maxTotalUsableIncome = 0;
    let maxTotalExpenses = 0;

    for (const month in data) {
      const monthData = data[month];

      // Find max total usable income
      if (monthData.totalUsableIncome > maxTotalUsableIncome) {
        maxTotalUsableIncome = monthData.totalUsableIncome;
      }

      // Find max total expenses
      if (monthData.totalExpenses > maxTotalExpenses) {
        maxTotalExpenses = monthData.totalExpenses;
      }
    }

    // Return the larger of the two maximums
    return Math.max(maxTotalUsableIncome, maxTotalExpenses);
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

  /** This method filters the months based on the selected time frame */
  filterMonths() {
    const currentYear = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth() + 1; // 1-based
  
    this.filteredMonthsByYear = Object.keys(this.localStorageData).reduce((acc, monthKey) => {
      /** Since monthKey is in YYYY-MM format, we can split them using '-' here to get the year and the month. */
      const [year, monthStr] = monthKey.split('-').map(Number);

      /** Convert month into a sequential number, calculated by year * 12 (to get year value) and plus month value.
       * This way we can compare the differences in time linearly with time complexity of O(1).
       * 
       * For example, 
       * 2021-01 will be converted to 2021 * 12 + 1 = 24253.
       * 2021-02 will be converted to 2021 * 12 + 2 = 24254.
       * 
       * So difference between 2021-01 and 2021-02 will be 24254 - 24253 = 1 (month).
       * 
       */
      const monthNumber = year * 12 + monthStr;
      const currentMonthNumber = currentYear * 12 + currentMonth;
  
      let includeMonth = false;
  
      if (this.selectedOption === 'show-all') {
        includeMonth = true; // Include all months without any filtering
      } else if (this.selectedOption === 'whole-year') {
        includeMonth = year === currentYear; // Include all months from the current year
        
      } else if (this.selectedOption === '2-years') {
        includeMonth = year === currentYear || year === currentYear - 1;
      }
      else {
        const monthsToShow = this.getMonthsToShow();
        const diff = currentMonthNumber - monthNumber;
        includeMonth = diff >= 0 && diff < monthsToShow; // Include only months within the range
      }
  
      if (includeMonth) {
        const yearStr = year.toString();
        acc[yearStr] = acc[yearStr] || [];
        acc[yearStr].push(monthKey);
      }
  
      return acc;
    }, {} as { [key: string]: string[] });

    for (let year in this.filteredMonthsByYear) {
      this.filteredMonthsByYear[year].sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        // Sort by month value in descending order (larger months should come first)
        return monthB - monthA; 
      });
    }
  
    this.allFilteredMonths = Object.values(this.filteredMonthsByYear).flat();
    this.populateChartData(this.allFilteredMonths);
  }
  
  /** Returns the number of months to show based on the selected option */
  getMonthsToShow(): number {
    return this.selectedOption === '3-months' ? 3 :
           this.selectedOption === '6-months' ? 6 :
           this.selectedOption === '12-months' ? 12 : 0;
  }

  /** Trigger filtering when a new option is selected from the dropdown */
  onOptionSelected() {
    this.filterMonths(); // Filter the months based on selected option
  }


  getMonthDisplayInfos(month: string): { name: string, type: string, value: number }[] {
    // if (this.monthInfoCache[month]) {
    //   return this.monthInfoCache[month];
    // }

    const currentMonthData = this.localStorageData[month];
    const incomeEntries = currentMonthData.rawInput
      .filter(entry => entry.type === EntryType.Income)
      .map(entry => ({ type: EntryType.Income, name: entry.target, value: entry.value }));
    
    const expenseEntries = currentMonthData.pieData
      .filter(entry => entry.name !== this.dataService.REMAINING_BALANCE_LABEL)
      .map(entry => ({ type: 'expense', name: removeSystemPrefix(entry.name), value: entry.value }));
    
    const taxEntry = currentMonthData.rawInput.find(entry => entry.type === EntryType.Tax);
    if (taxEntry) {
      incomeEntries.push({ type: EntryType.Tax, name: taxEntry.target, value: taxEntry.value });
    }

    const result = [...incomeEntries, ...expenseEntries].sort((a, b) => b.value - a.value);
    // this.monthInfoCache[month] = result; // Cache result
    return result;
  }


  /** After filtering, we need to re-populate the chart data */
  populateChartData(allMonths: string[] = []) {
    const filteredData = Object.entries(this.localStorageData)
      .filter(([month]) => allMonths.includes(month))
      .map(([month, value]) => ({
        month,
        surplus: parseLocaleStringToNumber(value.remainingBalance) || 0,
      }));

    // Sort the filtered data by month in chronological order
    const sortedData = filteredData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

    // Add 'balance' property by calculating cumulative balance
    let previousBalance = 0; // Initial balance can be customized
    this.surplusChartData = sortedData.map((entry) => {
      const balance = Math.round((previousBalance + entry.surplus) * 100) / 100;
      previousBalance = balance;
      return {
        ...entry,
        balance,
      };
    });

    /** Scale the chart every time filter changes */
    this.getScaleValue();
  }


  /** Scale the bar chart across all months to have the same xAxis.
   * This is useful for comparing income and expenses across different months.
   * 
   * We use this by finding the largest value of either total income or total expenses, then set that as
   * max xAxis value for the bar chart.
   */
  getScaleValue() {
    /** Get all showing months (Filtered month by selected time frame) */
    const showingMonths = this.filterDataByKeys(this.localStorageData, this.allFilteredMonths);
    // Get largest value of either total income or total expenses among the showing months
    const largestValue = this.findLargestValue(showingMonths);

    // Set the scale value to the largest value; if scale is turned off, set it to 0.
    this.isBarChartScaled ? this.dataService.incomeExpenseScaleValue.set(largestValue) : this.dataService.incomeExpenseScaleValue.set(0);
  }

  /** Get data of selected months.
   * @param data: MonthlyData: Data to be filtered, in this case, all months data
   * @param keys: string[]: Keys to be filtered (yyyy-mm), in this case, months we want to get.
   * 
   * @returns MonthlyData: Filtered data based on the keys.
   */
  filterDataByKeys(data: MonthlyData, keys: string[]) {
    return Object.keys(data)
      .filter(key => keys.includes(key))
      .reduce((acc: MonthlyData, key: string) => {
        acc[key] = data[key];
        return acc;
      }, {});
  }

  calculateTotalSurplusOfYear(year: string): string {
    let totalSurplus = 0;
    const months = this.filteredMonthsByYear[year]; // Use filtered months

    if (months) {
      for (const month of months) {
        const balanceString: string = this.localStorageData[month].remainingBalance || '0';
        const numericBalance: number = parseLocaleStringToNumber(balanceString);
        totalSurplus += isNaN(numericBalance) ? 0 : numericBalance;
      }
    }
    return this.isFormatBigNumbers ? formatBigNumber(totalSurplus, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency())) : this.currencyPipe.transform(totalSurplus, this.currencyService.getSelectedCurrency()) || totalSurplus.toLocaleString('en-US');
  }

  /** For Calculating all time balance based on selected time frame. */
  calculateTotalSurplusAllTimeFiltered(): string {
    let totalSurplus = 0;

    for (const year in this.filteredMonthsByYear) {
        const months = this.filteredMonthsByYear[year];

        if (months) {
            for (const month of months) {
                const balanceString: string = this.localStorageData[month].remainingBalance || '0';
                const numericBalance: number = parseLocaleStringToNumber(balanceString);
                totalSurplus += isNaN(numericBalance) ? 0 : numericBalance;
            }
        }
    }

    return this.isFormatBigNumbers ? formatBigNumber(totalSurplus, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency())) : this.currencyPipe.transform(totalSurplus, this.currencyService.getSelectedCurrency()) || totalSurplus.toLocaleString('en-US');
  }

  /** Calculating all time balance literally, independent from time frame. (NOT IMPLEMENTED) */
  calculateTotalSurplusAllTime(): string {
    let totalSurplus = 0;

    for (const month in this.localStorageData) {
        const balanceString: string = this.localStorageData[month].remainingBalance || '0';
        const numericBalance: number = parseLocaleStringToNumber(balanceString);
        totalSurplus += isNaN(numericBalance) ? 0 : numericBalance;
    }

    return this.isFormatBigNumbers ? formatBigNumber(totalSurplus, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency())) : totalSurplus.toLocaleString('en-US');
  }


  /** Get remaining balance formatted to big numbers */
  getFormattedRemainingBalance(month: string): string {
    const balanceString: string = this.localStorageData[month].remainingBalance || '0';
    const numericBalance: number = parseLocaleStringToNumber(balanceString);
    return this.isFormatBigNumbers ? formatBigNumber(numericBalance, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency())) : this.currencyPipe.transform(numericBalance, this.currencyService.getSelectedCurrency()) || numericBalance.toLocaleString('en-US');
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

  formatBigNumbersTemplate(num: number): string {
    return formatBigNumber(num, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency()));
  }

  /** This function is used to get details of the corresponding month. It opens the main page dialog.
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
