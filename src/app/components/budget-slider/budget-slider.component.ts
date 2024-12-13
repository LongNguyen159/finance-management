import { Component, inject, OnInit } from '@angular/core';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { DataService } from '../../services/data.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { BudgetSlider, ExpenseCategory, expenseCategoryDetails, MonthlyData, SYSTEM_PREFIX } from '../models';
import { CommonModule } from '@angular/common';
import {MatSliderModule} from '@angular/material/slider';
import { formatBigNumber, removeSystemPrefix, roundToNearestHundreds } from '../../utils/utils';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ColorService } from '../../services/color.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CurrencyService } from '../../services/currency.service';
import { MatDividerModule } from '@angular/material/divider';
import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {MatListModule, MatListOption, MatSelectionListChange} from '@angular/material/list';


@Component({
  selector: 'app-budget-slider',
  standalone: true,
  imports: [
    CommonModule,
    MatSliderModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatDividerModule,
    FormsModule,
    MatStepperModule,
    MatListModule
  ],
  templateUrl: './budget-slider.component.html',
  styleUrl: './budget-slider.component.scss'
})
export class BudgetSliderComponent extends BasePageComponent implements OnInit {
  dataService = inject(DataService)
  colorService = inject(ColorService)
  currencyService = inject(CurrencyService)
  
  allMonthsData: MonthlyData
  currentDate: Date = new Date();
  filteredMonthsByYear: { [key: string]: string[] } = {};
  filteredMonths: string[] = [];

  //#region Income/Expense/Surplus
  // Pie Category data that contains average values to populate sliders on init
  averagePieData: { name: string, averageValue: number }[] = [];

  /** User defined metrics: Income and target surplus.
   * Total expenses are calculated based on the sliders.
   */
  targetSurplus: number = 0

  totalExpenses: number = 0

  MONTHS_TO_CALCULATE_AVG = 12

  calculationBasis: 'monthly' | 'yearly' = 'monthly';
  multiplier: number = 1

  // Average Income/Expense gathered to populate the sliders on init
  averageIncome: number = 0 // Can be changed by user for more accurate calculations
  form = new FormGroup({
    averageIncome: new FormControl(1), // Initial value
    targetSavings: new FormControl(this.targetSurplus), // Initial value
  });


  //#endregion

  //#region Sliders
  /** All sliders */
  masterSliders: BudgetSlider[] = [];

  /** Visible sliders. The total expense will still include the hidden sliders, that is why we used master sliders to calculate the total. */
  visibleSliders: BudgetSlider[] = [];
  hiddenSliders: BudgetSlider[] = [];
  essentialSliders: BudgetSlider[] = [];

  initialSliders: any[] = []; // To store the initial slider values
  sliderHistory: any[][] = []
  maxHistorySize: number = 15

  autoFit: boolean = false; // Auto-fit sliders to stay within target surplus
  allSlidersLocked: boolean = false; // Lock all sliders at once
  //#endregion

  /** All categories. */
  allCategories = Object.values(ExpenseCategory) as string[];
  expenseCategoryDetails = expenseCategoryDetails
  

  /** Categories to show only in the final sliders.
   * The categories which are not included will still add their value up to the total expenses, they are just hidden for clarity.
   */
  categoriesToInclude: string[] = [];

  /** Store Essential Categories selected by user */
  essentialCategories: string[] = [];
  /** Store all non-essential categories. (allCategories - essentialCategories = nonEssentialCategories) */
  nonEssentialCategories: string[] = [];

  configFinished: boolean = false;
  
  ngOnInit(): void {
    this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe((allMonthsData: MonthlyData) => {
      this.allMonthsData = allMonthsData;
      this.getMetricsFromLastNMonths(this.MONTHS_TO_CALCULATE_AVG);
    })

    /** Input changes */
    this.form.get('averageIncome')?.valueChanges
    .pipe(debounceTime(300)) // Add debounce to reduce frequent updates
    .subscribe((value) => {
      const newValue = value ?? 0;
      if (this.averageIncome !== newValue) {
        this.averageIncome = newValue; // Update the displayed value
        this.form.get('averageIncome')?.setValue(this.averageIncome, { emitEvent: false }); // Update the form control value without emitting an event
      }
    });

    this.form.get('targetSavings')?.valueChanges
      .pipe(debounceTime(300))
      .subscribe((value) => {
        this.targetSurplus = value ?? 0;
      });
  }

  //#region Input Changes
  /** Recalculate Metrics and populate the sliders with appropriate values for the selected time frame. */
  onCalculationBasisChange(option: 'monthly' | 'yearly') {
    this.calculationBasis = option
    this.multiplier = option === 'yearly' ? 12 : 1;
    this.getMetricsFromLastNMonths(this.MONTHS_TO_CALCULATE_AVG);
  }
  //#endregion

  /** Gather the metrics from last N months to populate the sliders initially. */
  getMetricsFromLastNMonths(lastNMonths: number) {
    const currentYear = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth() + 1; // 1-based
  
    this.filteredMonths = Object.keys(this.allMonthsData).reduce((acc, monthKey) => {
      const [year, monthStr] = monthKey.split('-').map(Number);
      const monthNumber = year * 12 + monthStr;
      const currentMonthNumber = currentYear * 12 + currentMonth;
      const monthsToShow = lastNMonths;
      const diff = currentMonthNumber - monthNumber;
      const includeMonth = diff >= 0 && diff < monthsToShow; // Include only months within the range
  
      if (includeMonth) {
        acc.push(monthKey);
      }
  
      return acc;
    }, [] as string[]);

    const totalExpenses = this.filteredMonths.reduce((acc, month) => {
      return acc + this.allMonthsData[month].totalExpenses;
    }, 0);

    const totalUsableIncome = this.filteredMonths.reduce((acc, month) => {
      return acc + this.allMonthsData[month].totalUsableIncome;
    }, 0);

    const averageExpenses = totalExpenses / this.filteredMonths.length;
    const averageUsableIncome = totalUsableIncome / this.filteredMonths.length;

    // Adjust based on calculation basis
    const multiplier = this.multiplier;

    this.totalExpenses = roundToNearestHundreds(averageExpenses * multiplier);
    this.averageIncome = roundToNearestHundreds(averageUsableIncome * multiplier);

    // Update the form values
    this.form.get('averageIncome')?.setValue(this.averageIncome);

    const aggregatedPieData = this.filteredMonths.reduce((acc, month) => {
      this.allMonthsData[month].pieData.forEach(item => {
        if (item.name.includes(SYSTEM_PREFIX)) {
          if (!acc[item.name]) {
            acc[item.name] = { total: 0, count: 0 };
          }
          acc[item.name].total += item.value;
          acc[item.name].count += 1;
        }
      });
      return acc;
    }, {} as { [key: string]: { total: number, count: number } });

    this.averagePieData = Object.keys(aggregatedPieData).map(name => ({
      name: name,
      averageValue: Math.round((aggregatedPieData[name].total / this.MONTHS_TO_CALCULATE_AVG) * multiplier * 100) / 100
    }));


    this.populateSliders();
  }

  /** Recalculate Total Expenses. Use this function when user undo or reset sliders.  */
  recalculateExpenses() {
    this.totalExpenses = roundToNearestHundreds(this.masterSliders.reduce((acc, item) => acc + item.value, 0));
  }

  /** Populate Sliders with initial values (untouched).
   * The intial values come from average from the last N months.
   */
  populateSliders() {
    const totalCategoryValues = this.averagePieData.reduce((sum, data) => sum + data.averageValue, 0);
    const minMaxThreshold = this.averageIncome * 0.05; // Minimum 5% of income
  
    const allCategories = Object.values(ExpenseCategory) as string[];
    const categoriesToInclude = ['Food', 'Shopping', 'Entertainment'];
    
    this.masterSliders = allCategories
      // .filter((categoryName) => categoriesToInclude.includes(removeSystemPrefix(categoryName))) // Filter by your desired categories
      .map((categoryName) => {
        const matchingData = this.averagePieData.find(data => data.name === categoryName);
        const averageValue = matchingData ? matchingData.averageValue : 0;
        const percentage = totalCategoryValues ? averageValue / totalCategoryValues : 0;
  
        const dynamicMax = this.averageIncome * Math.max(percentage * 3, 0.05); // Scaled or 5% of income
        const max = Math.max(dynamicMax, minMaxThreshold); // Ensure minimum threshold
  
        const categoryDetails = expenseCategoryDetails[categoryName as ExpenseCategory];
  
        return {
          name: categoryName,
          value: roundToNearestHundreds(averageValue),
          min: 0,
          max: roundToNearestHundreds(max),
          locked: this.allSlidersLocked,
          weight: 1, // Default weight, can be user-adjusted
          icon: categoryDetails.icon,
          colorDark: categoryDetails.colorDark,
          colorLight: categoryDetails.colorLight,
        };
      });
  
    this.initialSliders = JSON.parse(JSON.stringify(this.masterSliders)); // Deep copy for reset
    this.saveState(); // Save initial state
    console.log('Master Sliders on Init:', this.masterSliders);
  }

  /** Get categories details based on name (with system prefix) */
  getCategoriesDetails(categoryName: string) {
    return expenseCategoryDetails[categoryName as ExpenseCategory]
  }


  //#region Stepper Navigation

  /** Save essential categories selection on user checkbox change. */
  onEssentialCategoriesChange(event: MatSelectionListChange): void {
    this.saveEssentialCategories(event.source.selectedOptions.selected);
  }

  onNonEssentialCategoriesChange(event: MatSelectionListChange): void {
    this.saveNonEssentialCategories(event.source.selectedOptions.selected);
  }
  
  saveEssentialCategories(categories: MatListOption[]): void {
    this.essentialCategories = categories.map(c => c.value);

    this.essentialSliders = this.essentialCategories.map(category => this.createSlider(category, true));

    // Merge essential sliders into master sliders, so that essential categories are locked.
    this.masterSliders = [
      ...this.essentialSliders,
      ...this.masterSliders.filter(slider => !this.essentialCategories.includes(slider.name))
    ];

    /** Populate non essential categories for next step */
    this.nonEssentialCategories = this.allCategories.filter(c => !this.essentialCategories.includes(c));
  }

  saveNonEssentialCategories(categories: MatListOption[]): void {
    const includedNonEssential = categories.map(c => c.value);
    this.categoriesToInclude = includedNonEssential; // Only include non-essentials in visible sliders

    // Filter master sliders into visible and hidden
    this.visibleSliders = this.masterSliders.filter(slider => 
        !slider.isEssential && this.categoriesToInclude.includes(slider.name)
    );

    this.hiddenSliders = this.masterSliders.filter(slider => 
        slider.isEssential || !this.categoriesToInclude.includes(slider.name)
    );
    this.syncSliders()
  }

  private createSlider(category: string, isEssential: boolean): any {
    const matchingData = this.averagePieData.find(data => data.name === category);
    const value = matchingData ? matchingData.averageValue : 0;
    const minMaxThreshold = this.averageIncome * 0.05; // Minimum 5% of income
    const max = Math.max((value + 1) * 1.5, minMaxThreshold);

    const categoryDetails = expenseCategoryDetails[category as ExpenseCategory];

    return {
        name: category,
        value: roundToNearestHundreds(value),
        min: 0,
        max: roundToNearestHundreds(max),
        locked: isEssential, // Lock essential categories
        weight: isEssential ? 20 : 1, // Higher weight for essential categories
        icon: categoryDetails.icon,
        colorDark: categoryDetails.colorDark,
        colorLight: categoryDetails.colorLight,
        isEssential: isEssential,
    };
  }

  finishConfig() {
    this.configFinished = true;
    this.autoAdjustSliders()
  }

  //#endregion


  //#region Save/Undo/Reset
  /** Save current state of sliders into history buffer, this allows for `undo` to work. */
  saveState(): void {
    // Deep copy the current sliders state
    const currentState = JSON.parse(JSON.stringify(this.masterSliders));
    this.sliderHistory.push(currentState);

    // Maintain history size
    if (this.sliderHistory.length > this.maxHistorySize) {
      this.sliderHistory.shift(); // Remove the oldest state
    }
  }

  /** Revert to previous state. */
  undo(): void {
    if (this.sliderHistory.length > 1) {
      // Remove the latest state and revert to the previous state
      this.sliderHistory.pop();
      const previousState = this.sliderHistory[this.sliderHistory.length - 1];
      this.masterSliders = JSON.parse(JSON.stringify(previousState)); // Deep copy
      this.recalculateExpenses()
    } else {
      console.warn('No more states to undo!');
    }
  }

  /** Reset sliders to their initial state. (Populated by `populateSliders()`) */
  resetSliders(): void {
    if (this.initialSliders.length === 0) {
      console.error("Initial sliders not available for reset");
      return;
    }
  
    // Restore sliders to their initial state
    const resetState = JSON.parse(JSON.stringify(this.initialSliders)); // Deep copy to avoid reference issues
  
    // Check if the current state matches the reset state
    const currentState = JSON.stringify(this.masterSliders);
    if (currentState !== JSON.stringify(resetState)) {
      this.masterSliders = resetState; // Apply the reset state
      this.saveState(); // Save the reset state to history
      this.recalculateExpenses();
    } else {
      console.info("Sliders are already in the reset state, no need to save again.");
    }
  }  
  //#endregion


  //#region Slider adjustments

  toggleLockSlider(sliderName: string) {
    const targetIndex = this.masterSliders.findIndex((item) => item.name === sliderName);
    if (targetIndex === -1) {
      console.error("Item not found");
      return;
    }
    this.masterSliders[targetIndex].locked = !this.masterSliders[targetIndex].locked;
  }

  toggleLockAllSliders() {
    this.allSlidersLocked = !this.allSlidersLocked;

    if (this.allSlidersLocked) {
      this.masterSliders.forEach((item) => item.locked = true);
    } else {
      this.masterSliders.forEach((item) => item.locked = false);
    }
  }



  /** IMPORTANT: Remember to save slider state on slider changes. */
  /** Modify the min value of the slider */
  adjustMinValue(sliderName: string, minValue: string): void {
    this.saveState() // Save the current state before making changes

    /** Input is in string value, parse to float values */
    const min = parseFloat(minValue);
    // Find the item to update
    const targetIndex = this.masterSliders.findIndex((item) => item.name === sliderName);
    if (targetIndex === -1) {
      console.error("Item not found");
      return;
    }
  
    // Update the target value
    this.masterSliders[targetIndex].min = min;
  }

  /** Readjust the sliders so that the total stays below target surplus defined by user. */
  adjustSliders(name: string, newValue: number): void {
    // Save the current state before making changes
    this.saveState();
  
    // Find the slider in masterSliders
    const targetSlider = this.masterSliders.find((item) => item.name === name);
    if (!targetSlider) {
      console.error("Slider not found in masterSliders");
      return;
    }
  
    const originalValue = targetSlider.value;
    const maxSum = this.averageIncome - this.targetSurplus;
  
    // Update the target slider's value while respecting its constraints
    targetSlider.value = Math.max(roundToNearestHundreds(newValue), targetSlider.min || 0);
    if (targetSlider.value >= (targetSlider.max || 1) - 1) {
      targetSlider.max = Math.ceil(targetSlider.value + targetSlider.value * 0.2); // Dynamically adjust max
    }
  
    // Calculate the total expenses after adjustment
    const currentSum = this.masterSliders.reduce((sum, item) => sum + item.value, 0);
    this.totalExpenses = roundToNearestHundreds(currentSum);
  
    if (currentSum > maxSum) {
      const excess = currentSum - maxSum;
      this.adjustOtherSliders(excess, targetSlider, "reduce");
    } else if (this.autoFit && currentSum < maxSum) {
      const deficit = maxSum - currentSum;
      this.adjustOtherSliders(deficit, targetSlider, "increase");
    }
  
    // Final recheck to ensure rounding errors do not exceed constraints
    const finalSum = this.masterSliders.reduce((sum, item) => sum + item.value, 0);
    if (finalSum > maxSum) {
      console.warn("Adjustment left the total above the maximum allowed.");
    }

    console.log('Master Sliders after adjustment:', this.masterSliders);
  
    // Sync visible sliders with updated values from masterSliders
    this.syncSliders()
  }

  autoAdjustSliders(): void {
    // Save the current state before making changes
    this.saveState();
    
    // Calculate the max sum (target surplus)
    const maxSum = this.averageIncome - this.targetSurplus;
    
    // Calculate the current total sum of all slider values
    const currentSum = this.masterSliders.reduce((sum, item) => sum + item.value, 0);
    
    // Calculate the amount of adjustment needed
    const adjustmentAmount = maxSum - currentSum;

  
    if (adjustmentAmount === 0) {
      console.log("No adjustment needed.");
      return;
    }
  
    // Get all sliders that are not locked
    const adjustableSliders = this.masterSliders.filter((item) => !item.locked);
    
    // Calculate the total weight of the adjustable sliders
    const totalWeight = adjustableSliders.reduce((sum, item) => sum + item.weight, 0);
  
    if (totalWeight === 0) {
      console.error("No adjustable sliders available.");
      return;
    }
  
    // Distribute the adjustment across the sliders based on their weight
    adjustableSliders.forEach((slider) => {
      const adjustment = (slider.weight / totalWeight) * adjustmentAmount;
  
      if (adjustment > 0) {
        // Increase slider value but ensure it doesn't exceed its max
        slider.value = Math.min(roundToNearestHundreds(slider.value + adjustment), slider.max || Infinity);
      } else {
        // Decrease slider value but ensure it doesn't go below its min
        slider.value = Math.max(roundToNearestHundreds(slider.value + adjustment), slider.min || 0);
      }
    });
  
    // Recalculate the total expenses after adjustment
    const finalSum = this.masterSliders.reduce((sum, item) => sum + item.value, 0);
    
    // Check if the final sum exceeds the max allowed value
    if (finalSum > maxSum) {
      console.warn("Adjustment left the total above the maximum allowed.");
    }
  
    // Sync the visible sliders with the updated master sliders
    this.syncSliders()
    
    console.log('Master Sliders after auto adjustment:', this.masterSliders);
  }
  


  adjustOtherSliders(amount: number, targetSlider: any, action: "reduce" | "increase"): void {
    // Filter sliders eligible for adjustment
    const adjustableSliders = this.masterSliders.filter(
      (item) => item.name !== targetSlider.name && !item.locked
    );

  
    const totalWeight = adjustableSliders.reduce((sum, item) => sum + item.weight, 0);
  
    if (totalWeight === 0) {
      console.error("No sliders available for adjustment.");
      targetSlider.value = roundToNearestHundreds(targetSlider.value - amount); // Revert to maintain balance
      return;
    }
  
    // Distribute the adjustment proportionally
    adjustableSliders.forEach((item) => {
      const adjustment = (item.weight / totalWeight) * amount;
      if (action === "reduce") {
        item.value = Math.max(roundToNearestHundreds(item.value - adjustment), item.min || 0);
      } else if (action === "increase") {
        item.value = Math.min(roundToNearestHundreds(item.value + adjustment), item.max || Infinity);
      }
    });
  }

  syncSliders(): void {
    // Update only the values in visible sliders based on the master sliders
    this.visibleSliders.forEach((visibleSlider) => {
      const masterSlider = this.masterSliders.find((item) => item.name === visibleSlider.name);
      if (masterSlider) {
        visibleSlider.value = masterSlider.value; // Override only the value
      }
    });
  
    // Recalculate expenses after syncing
    this.recalculateExpenses();
  
    // Update hidden sliders based on the latest changes
    this.hiddenSliders = this.masterSliders.filter(slider => 
      slider.isEssential || !this.categoriesToInclude.includes(slider.name)
    );
  
    // Ensure the visible sliders are synced with the categories to include
    this.visibleSliders = this.masterSliders.filter(slider => 
      !slider.isEssential && this.categoriesToInclude.includes(slider.name)
    );
  }

  syncVisibleSliders(): void {
    this.visibleSliders.forEach((visibleSlider) => {
      const masterSlider = this.masterSliders.find((item) => item.name === visibleSlider.name);
      if (masterSlider) {
        visibleSlider.value = masterSlider.value;
      }
    });
  }
  
  
  //#endregion

  //#region Formatting
  formatBigNumbers(value: number): string {
    return formatBigNumber(value);
  }

  formatBigNumbersFrom1K(value: number): string {
    return formatBigNumber(value, '', 1000);
  }

  removeSystemPrefix(name: string): string {
    return removeSystemPrefix(name);
  }

  //#endregion
}