import { ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataService } from '../../services/data.service';
import { Abnormality, AbnormalityConfig, AbnormalityType, ExpenseCategory, expenseCategoryDetails, MonthlyData, SingleMonthData, TreeNode, TrendsLineChartData } from '../models';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ColorService } from '../../services/color.service';
import { UiService } from '../../services/ui.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogData } from '../dialogs/confirm-dialog/confirm-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { detectAbnormalities, formatBigNumber, formatYYYYMMtoDate, parseLocaleStringToNumber, removeSystemPrefix, sortYearsDescending } from '../../utils/utils';
import { TotalSurplusLineChartComponent } from "../charts/total-surplus-line-chart/total-surplus-line-chart.component";
import { takeUntil } from 'rxjs';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { MatButtonModule } from '@angular/material/button';
import { MainPageDialogComponent } from '../dialogs/main-page-dialog/main-page-dialog.component';
import { EntryType } from '../models';
import { IncomeExpenseRatioChartComponent } from "../charts/income-expense-ratio-chart/income-expense-ratio-chart.component";
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyService } from '../../services/currency.service';
import { MatMenuModule } from '@angular/material/menu';
import { TreemapChartComponent } from "../charts/treemap-chart/treemap-chart.component";
import { MatDividerModule } from '@angular/material/divider';
import { SimpleMonthPickerComponent } from "../simple-month-picker/simple-month-picker.component";
import { TrendsLineChartComponent } from "../charts/trends-line-chart/trends-line-chart.component";

@Component({
  selector: 'app-storage-manager',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, CommonModule, MatExpansionModule,
    MatSelectModule, TotalSurplusLineChartComponent, MatButtonModule, IncomeExpenseRatioChartComponent,
    MatCardModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatMenuModule, TreemapChartComponent,
    MatDividerModule,
    SimpleMonthPickerComponent, TrendsLineChartComponent],
  providers: [
    CurrencyPipe,
  ],
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
  allMonthsData: MonthlyData = {};

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

  isHighlightSurplus: boolean = false;

  showIncomeGrowth: boolean = true
  stackCategories: boolean = true

  /** Available time frame options for the dropdown menu */
  availableOptions: { value: string, label: string }[] = [
    { value: '3-months', label: 'Last 3 months' },
    { value: '6-months', label: 'Last 6 months' },
    { value: 'whole-year', label: 'This Year' },
    { value: '2-years', label: '2 Years' },
    { value: 'show-all', label: 'All time' }
  ];

  /** New properties for selecting month range */
  startMonth: string = '';
  endMonth: string = '';

  startMonthDate: Date = new Date();
  endMonthDate: Date = new Date();

  /** Get today's Date */
  currentDate = new Date();
  
  filteredMonthsByYear: { [key: string]: string[] } = {};

  /** Store filtered month strings in YYYY-MM format */
  allFilteredMonths: string[] = [];

  /** Chart data to plot the surplus and balance of each month  */
  trendsLineChartData: TrendsLineChartData[] = [];

  treeMapData: TreeNode[] = [];

  totalNetIncome: number = 0;
  totalExpenses: number = 0;

  showReports: boolean = true;

  anomalyReports: any[] = [];

  anomalyReportsExpanded: boolean = false;

  private monthInfoCache: { [key: string]: { name: string, type: string, value: number }[] } = {};
  hasDataChanged: boolean = false;


  ngOnInit(): void {
    /** Get all months data and refresh data if input changes */
    this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
      this.allMonthsData = data;
      this.refreshData();
      this.filterMonths();
    })
    
    this.refreshData();
    this.loadFormatBigNumbersState();
    this.storedYears = this.getStoredYears();
    this.filterMonths(); // Initially filter based on the default option

    /** Sole purpose is to expand the panel if it matches the selected year in date picker */
    this.selectedYear = this.dataService.selectedActiveDate.getFullYear().toString();    
  }


  //#region Retrieve Data
  /** Refresh data by get stored months again. */
  refreshData() {
    this.hasDataChanged = true;
    this.storedMonths = Object.keys(this.allMonthsData);
    this.storedYears = this.getStoredYears();
  }

  getStoredYears(): string[] {
    const years = Object.keys(this.allMonthsData).map(month => month.split('-')[0]);
    const sortedYears = sortYearsDescending(Array.from(new Set(years))); 
    return sortedYears
  }

  getStoredMonths(): { [key: string]: string[] } {
    const monthsByYear: { [key: string]: string[] } = {};
    // Iterate over the months stored in localStorageData
    for (const month in this.allMonthsData) {
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
  //#endregion


  //#region Filtering
  /** This method filters the months based on the selected time frame or custom range */
  filterMonths() {
    const currentYear = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth() + 1; // 1-based
  
    this.filteredMonthsByYear = Object.keys(this.allMonthsData).reduce((acc, monthKey) => {
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
      else if (this.selectedOption === 'custom-range') {
        const startMonthNumber = this._convertToMonthNumber(this.startMonth);
        const endMonthNumber = this._convertToMonthNumber(this.endMonth);
        includeMonth = monthNumber >= startMonthNumber && monthNumber <= endMonthNumber;
      } else {
        const monthsToShow = this._getMonthsToShow();
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

  filterMonthlyData(
    monthlyData: MonthlyData,
    keysToKeep: string[]
  ): MonthlyData {
    // Use Object.entries to filter and then reconstruct the object
    const filteredEntries = Object.entries(monthlyData).filter(([key]) =>
      keysToKeep.includes(key)
    );
  
    // Convert the filtered entries back into an object
    return Object.fromEntries(filteredEntries);
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

  /** Helper Function for `filterMonths()` 
   * Returns the number of months to show based on the selected option */
  private _getMonthsToShow(): number {
    return this.selectedOption === '3-months' ? 3 :
           this.selectedOption === '6-months' ? 6 : 0
  }

  /** Helper function to convert YYYY-MM to a sequential month number */
  private _convertToMonthNumber(month: string): number {
    const [year, monthStr] = month.split('-').map(Number);
    return year * 12 + monthStr;
  }

  /** Trigger filtering when a new option is selected from the dropdown */
  onOptionSelected() {
    if (this.selectedOption == 'custom-range') {
      this.onDateChanges()
      return
    }
    this.startMonth = '';
    this.endMonth = '';
    this.availableOptions = this.availableOptions.filter(option => option.value !== 'custom-range');
    this.filterMonths(); // Filter the months based on selected option
  }
  
  /** Custom-Range: When user uses the calendar to choose range. */
  onDateChanges() {
    this.selectedOption = 'custom-range';
    if (!this.availableOptions.find(option => option.value === 'custom-range')) {
      this.availableOptions.push({ value: 'custom-range', label: 'Custom' });
    }
    this.filterMonths();
  }


  /** Get months display infos to display in template.
   * @param month: string: Month in YYYY-MM format.
   * 
   * @returns: Entries of each month, consists of name, type (income/expenses) and their value.
   * We get the type to display colour based on the type (red for expenses, green for income).
   */
  getMonthDisplayInfos(month: string): { name: string, type: string, value: number }[] {
    if (this.monthInfoCache[month] && !this.hasDataChanged) {
      return this.monthInfoCache[month];
    }

    const currentMonthData = this.allMonthsData[month];
    if (!currentMonthData) {
      return [];
    }

    const incomeEntries = (currentMonthData.rawInput || [])
      .filter(entry => entry.type === EntryType.Income)
      .map(entry => ({ type: EntryType.Income, name: entry.target, value: entry.value }));
    
    const expenseEntries = (currentMonthData.pieData || [])
      .filter(entry => entry.name !== this.dataService.REMAINING_BALANCE_LABEL)
      .map(entry => ({ type: 'expense', name: removeSystemPrefix(entry.name), value: entry.value }));
    
    const taxEntry = currentMonthData.rawInput.find(entry => entry.type === EntryType.Tax);
    if (taxEntry) {
      incomeEntries.push({ type: EntryType.Tax, name: taxEntry.target, value: taxEntry.value });
    }

    const result = [...incomeEntries, ...expenseEntries].sort((a, b) => b.value - a.value);
    this.monthInfoCache[month] = result; // Cache result
    this.hasDataChanged = false;
    return result;
  }
  //#endregion

  //#region Chart Data
  /** After filtering, we need to re-populate the chart data */

  /** Populate Chart data, tree map, and trends line */
  populateChartData(allMonths: string[] = []) {
    // Filter and process data
    const filteredData = this.filterMonthlyData(this.allMonthsData, allMonths);

    // Calculate and update total net income and expenses
    this.updateTotals(filteredData);

    // Aggregate yearly tree map data
    this.treeMapData = this.aggregateYearlyTree(filteredData);

    // Prepare sorted surplus data
    const sortedData = this.prepareSortedTrendsData(filteredData);

    // Handle and validate date range
    this.updateDateRange(sortedData);

    // Compute and update surplus chart data
    this.trendsLineChartData = this.computeSurplusChartData(sortedData);
    // Adjust chart scale
    this.getScaleValue();

    /** Get Anomalies Dections */
    const insights = detectAbnormalities(this.trendsLineChartData, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency()))
    this.anomalyReports = insights

    // Enrich the anomalyReports with category icon and color at root level
    this.anomalyReports = this.anomalyReports.map(category => {
      // Lookup category icon and color from the expenseCategoryDetails based on category.name
      const categoryDetails = expenseCategoryDetails[category.categoryName as ExpenseCategory];


      // Add category-specific icon and color at root level
      return {
        ...category,
        categoryIcon: categoryDetails?.icon || 'category',  // Fallback icon
        categoryColorLight: categoryDetails?.colorLight || '#757575',  // Fallback color
        categoryColorDark: categoryDetails?.colorDark || '#BDBDBD',  // Fallback color
        averageSpending: category.totalSpending / allMonths.length,
        abnormalities: category.abnormalities.map((abnormality: Abnormality) => ({
          ...abnormality,
          ...this.getAnomaliesConfig(abnormality.type),  // Keep anomaly type-related icon and color logic
        })),
      };
    });
  }

  /** Helper function: Calculate and update total net income and expenses */
  private updateTotals(filteredData: Record<string, SingleMonthData>) {
    const { totalNetIncome, totalExpenses } = Object.values(filteredData).reduce(
      (totals, month) => ({
        totalNetIncome: totals.totalNetIncome + month.totalUsableIncome,
        totalExpenses: totals.totalExpenses + month.totalExpenses,
      }),
      { totalNetIncome: 0, totalExpenses: 0 }
    );

    this.totalNetIncome = totalNetIncome;
    this.totalExpenses = totalExpenses;
  }

  /** Helper function: Prepare sorted surplus data */
  private prepareSortedTrendsData(filteredData: Record<string, SingleMonthData>) {
    return Object.entries(filteredData).map(([month, value]) => ({
      month,
      totalNetIncome: value.totalUsableIncome,
      totalExpenses: value.totalExpenses,
      surplus: parseLocaleStringToNumber(value.remainingBalance) || 0,
      categories: value.pieData.filter(item => item.name !== this.dataService.REMAINING_BALANCE_LABEL)
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  /** Helper function: Update start and end months based on sorted data */
  private updateDateRange(sortedData: Array<{ month: string }>) {
    const sortedMonths = sortedData.map(entry => entry.month);

    if (
      (this.startMonth &&
      this.endMonth) &&
      (!sortedMonths.includes(this.startMonth) || !sortedMonths.includes(this.endMonth))
    ) {
      this.uiService.showSnackBar(
        'No data found for the selected range. Showing available range instead.',
        'OK',
        5000
      );
    }

    this.startMonth = sortedMonths[0] || '';
    this.endMonth = sortedMonths.at(-1) || '';
    this.startMonthDate = formatYYYYMMtoDate(this.startMonth);
    this.endMonthDate = formatYYYYMMtoDate(this.endMonth);
  }

  /** Helper function: Compute surplus chart data (cummulate balance) */
  private computeSurplusChartData(sortedData: Array<any>) {
    let previousBalance = 0;
    return sortedData.map(entry => {
      const balance = Math.round((previousBalance + entry.surplus) * 100) / 100;
      previousBalance = balance;
      return { ...entry, balance };
    });
  }



  //#region Tree Map
  /** Check TreeMapData of each month: Call DataService if TreeMapData does not exist, use TreeMapData directly if it exists */
  aggregateYearlyTree(savedData: MonthlyData): TreeNode[] {
    const monthlyTrees: TreeNode[][] = [];
  
    // Iterate through each month in savedData
    for (const [month, data] of Object.entries(savedData)) {
      if (data.treeMapData) {
        // Use existing treeMapData if available
        monthlyTrees.push(data.treeMapData);
      } else {
        // Generate treeMapData using processInputData if missing
        const generatedTree = this.dataService.processInputData(data.rawInput, data.month, { emitObservable: false })?.treeMapData
        if (!generatedTree) {
          continue; // Skip if treeMapData is not generated
        }
        monthlyTrees.push(generatedTree);
  
        // Optionally, update the savedData object with the generated tree
        data.treeMapData = generatedTree;
      }
    }
  
    // Use mergeTrees to aggregate the monthlyTrees
    return this._mergeTrees(monthlyTrees);
  }

  /** Merge trees to get Overview/Summarised data, and show treeMap. */
  _mergeTrees(trees: TreeNode[][]): TreeNode[] {
    const result: TreeNode[] = [];
  
    // Helper function to merge a single node into the result tree
    function mergeNode(node: TreeNode, target: TreeNode[]) {
      const existingNode = target.find(n => n.name.toLowerCase() === node.name.toLowerCase());
      if (existingNode) {
        // If node exists, aggregate values and merge children
        existingNode.value += node.value;
        for (const child of node.children) {
          mergeNode(child, existingNode.children);
        }
      } else {
        // If node does not exist, add a deep copy to target
        target.push({ ...node, children: [] });
        const newNode = target[target.length - 1];
        for (const child of node.children) {
          mergeNode(child, newNode.children);
        }
      }
    }
  
    // Loop through all monthly trees and merge them
    for (const monthlyTree of trees) {
      for (const node of monthlyTree) {
        mergeNode(node, result);
      }
    }
  
    return result;
  }
  //#endregion
  
  //#region Scale Bar Chart
  /** Scale the bar chart across all months to have the same xAxis.
   * This is useful for comparing income and expenses across different months.
   * 
   * We use this by finding the largest value of either total income or total expenses, then set that as
   * max xAxis value for the bar chart.
   */
  getScaleValue() {
    /** Get all showing months (Filtered month by selected time frame) */
    const showingMonths = this.filterDataByKeys(this.allMonthsData, this.allFilteredMonths);
    // Get largest value of either total income or total expenses among the showing months
    const largestValue = this._findLargestValue(showingMonths);

    // Set the scale value to the largest value; if scale is turned off, set it to 0.
    this.isBarChartScaled ? this.dataService.incomeExpenseScaleValue.set(largestValue) : this.dataService.incomeExpenseScaleValue.set(0);
  }



  /** 
 * Helper Function for `getScaleValue()`
 * Find largest value (of either total income or total expenses) of given months.
 * This will be used later as a scale factor.
 * 
 * We will display an 'invisible' bar that has this value to make all the bars to have the same scale (same xAxis length)
 */
  private _findLargestValue(data: { [key: string]: any }) {
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
  //#endregion

  //#endregion



  //#region Surplus Calculation
  /** Calculate total Surplus of the given year.
   * @param year: string: Year in string format (YYYY).
   * @returns string: Total surplus of the given year.
   */
  calculateTotalSurplusOfYear(year: string): string {
    let totalSurplus = 0;
    const months = this.filteredMonthsByYear[year]; // Use filtered months

    if (months) {
      for (const month of months) {
        const balanceString: string = this.allMonthsData[month].remainingBalance || '0';
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
                const balanceString: string = this.allMonthsData[month].remainingBalance || '0';
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

    for (const month in this.allMonthsData) {
        const balanceString: string = this.allMonthsData[month].remainingBalance || '0';
        const numericBalance: number = parseLocaleStringToNumber(balanceString);
        totalSurplus += isNaN(numericBalance) ? 0 : numericBalance;
    }

    return this.isFormatBigNumbers ? formatBigNumber(totalSurplus, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency())) : totalSurplus.toLocaleString('en-US');
  }
  //#endregion



  //#region Formatting
  /** Get remaining balance formatted to big numbers */
  getFormattedRemainingBalance(month: string): string {
    const balanceString: string = this.allMonthsData[month].remainingBalance || '0';
    const numericBalance: number = parseLocaleStringToNumber(balanceString);
    return this.isFormatBigNumbers ? formatBigNumber(numericBalance, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency())) : this.currencyPipe.transform(numericBalance, this.currencyService.getSelectedCurrency()) || numericBalance.toLocaleString('en-US');
  }

  /** Expose utils function to template. Format big numbers into K, M, B (Thousands, Millions, Billions)
   * Min value: 10K
   */
  formatBigNumbersTemplate(num: number): string {
    return formatBigNumber(num, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency()));
  }

  //#endregion




  //#region Toggle Functions
  /** Persists the state of Big Number formatting */
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

  toggleAnomalyReports() {
    this.anomalyReportsExpanded = !this.anomalyReportsExpanded;
  }
  //#endregion





  /** [NOT IMPLEMENTED]: Remove whole month from local storage. Earlier this page was used as Storage Manager,
   * but later changed to Finance Manger. So, this feature is not implemented anymore.
   */
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


  /** This function is used to get details of the corresponding month. It opens the main page dialog.
   * @param month: string in YYYY-MM format.
   */
  getMonthsDetails(month: string) {
    this.dialog.open(MainPageDialogComponent, {
      data: this.allMonthsData[month],
      width: '100%',
      height: '80vh',
      maxWidth: '100vw',
      maxHeight: '90vh',
    })
  }

  //#region Getters

  /** Dislay first half and second half in the template */
  get firstHalf() {
    return this.anomalyReports.slice(0, Math.ceil(this.anomalyReports.length / 2));
  }

  get secondHalf() {
    return this.anomalyReports.slice(Math.ceil(this.anomalyReports.length / 2));
  }


  getAnomaliesConfig(type: AbnormalityType) {
    return AbnormalityConfig[type];
  }

  isPositiveBalance(): boolean {
    const balanceNumber = parseLocaleStringToNumber(this.calculateTotalSurplusAllTimeFiltered());
    return balanceNumber >= 0;
  }

  parseLocaleStringToNumber(value: string): number {
    return parseLocaleStringToNumber(value);
  }

  getBalanceClass(): string {
    return this.isPositiveBalance() ? 'positive-balance' : 'negative-balance';
  }

  getSurplusClass(month: string): string {
    if (!this.isHighlightSurplus) {
      return ''
    }
    const balanceString: string = this.allMonthsData[month].remainingBalance || '0';
    const numericBalance: number = parseLocaleStringToNumber(balanceString);
    return numericBalance >= 0 ? 'positive-balance' : 'negative-balance';
  }


  //#endregion

  openInsightsDialog() {
  }
}
