import { Component, inject, OnInit, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { DataService } from '../../services/data.service';
import { debounceTime, takeUntil } from 'rxjs';
import { BudgetSlider, ExpenseCategory, expenseCategoryDetails, MonthlyData, SYSTEM_PREFIX, Tracker } from '../models';
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
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import {MatListModule, MatListOption, MatSelectionListChange} from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { UiService } from '../../services/ui.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TrackingService } from '../../services/tracking.service';
import { ProgressCardComponent } from "../progress-card/progress-card.component";
import { DialogsService } from '../../services/dialogs.service';


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
    MatListModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonToggleModule,
],
  templateUrl: './budget-slider.component.html',
  styleUrl: './budget-slider.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class BudgetSliderComponent extends BasePageComponent implements OnInit {
  dataService = inject(DataService)
  colorService = inject(ColorService)
  currencyService = inject(CurrencyService)
  uiService = inject(UiService)
  trackingService = inject(TrackingService)
  dialogService = inject(DialogsService)

  @ViewChild('stepper') stepper: MatStepper;
  /** Retries count for stepper. Max attempts: 3.
   * This is to handle the case where the stepper is not available immediately after the component is initialized.
   * So we retry until the stepper is available.
   */
  private retryCount: number = 0;
  private maxRetries: number = 3;
  
  allMonthsData: MonthlyData
  currentDate: Date = new Date();
  /** Last N months */
  filteredMonths: string[] = [];

  monthsOfCurrentYear: string[] = []

  //#region Income/Expense/Surplus
  // Pie Category data that contains average values to populate sliders on init
  averagePieData: { name: string, averageValue: number }[] = [];
  aggregatedPieData: {name: string, totalValue: number}[] = []

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
    savingsType: new FormControl('absolute'), // Default to absolute
  });


  //#endregion

  //#region Sliders
  /** All sliders */
  masterSliders: BudgetSlider[] = [];

  /** Visible sliders. The total expense will still include the hidden sliders, that is why we used master sliders to calculate the total.
   * Visible Sliders will show non-essential categories selected by user.
   */
  visibleSliders: BudgetSlider[] = [];

  /** Hidden sliders are all the remaining sliders. Hidden for clarity. User can choose to optinally show them. */
  hiddenSliders: BudgetSlider[] = [];
  essentialSliders: BudgetSlider[] = [];

  /** To store intial sliders state. This is for undo and reset. */
  initialSliders: any[] = []
  sliderHistory: any[][] = []
  maxHistorySize: number = 15

  /** Auto Fit:
   * - false: only bring other sliders down when one slider is increased
   * - true: bring other sliders both up and down to make the total expense fit the target surplus.
   */
  autoFit: boolean = false;
  allSlidersLocked: boolean = false; // Lock all sliders at once
  panelOpenState = signal(false);
  //#endregion

  //#region Stepper Categories
  isCategoriesLoading: boolean = false;
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
  nonEssentialCategories = this.allCategories.filter(c => !this.essentialCategories.includes(c));

  /** Just for display purpose.
   * False: Show Guide Stepper
   * True: Show Final Sliders
   */
  configFinished: boolean = false;
  //#endregion
  
  


  ngOnInit(): void {
    this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe((allMonthsData: MonthlyData) => {
      this.allMonthsData = allMonthsData;
      this.getMetricsFromLastNMonths(this.MONTHS_TO_CALCULATE_AVG);
      this.getCurrentYearMetrics()
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

    this.form.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      const { averageIncome, targetSavings, savingsType } = this.form.value;
  
      if (savingsType === 'relative') {
        // Convert percentage to absolute
        this.targetSurplus = ((targetSavings || 1) / 100) * (averageIncome || 1);
      } else {
        // Directly use absolute value
        this.targetSurplus = targetSavings ?? 1;
      }
    });

    /** Retrieve Essential Categories selection from Local Storage */
    const savedEssentialCategories = JSON.parse(localStorage.getItem('essentialCategories') || '[]');
    if (savedEssentialCategories.length > 0) {
      this.essentialCategories = savedEssentialCategories;

      // Create sliders for saved essential categories
      this.essentialSliders = this.essentialCategories.map(category => this.createSlider(category, true));

      // Ensure master sliders include the saved essential sliders
      this.masterSliders = [
        ...this.essentialSliders,
        ...this.masterSliders.filter(slider => !this.essentialCategories.includes(slider.name))
      ];

      this.nonEssentialCategories = this.allCategories.filter(c => !this.essentialCategories.includes(c));
      // this.syncSliders();
    }
  }

  //#region Input Changes
  /** Recalculate Metrics and populate the sliders with appropriate values for the selected time frame. */
  onCalculationBasisChange(option: 'monthly' | 'yearly') {
    this.calculationBasis = option
    this.multiplier = option === 'yearly' ? 12 : 1;
    this.getMetricsFromLastNMonths(this.MONTHS_TO_CALCULATE_AVG);
  }
  //#endregion

  getCurrentYearMetrics() {
    const currentYear = this.currentDate.getFullYear();

    this.monthsOfCurrentYear = Object.keys(this.allMonthsData).reduce((acc, monthKey) => {
      const [year, monthStr] = monthKey.split('-').map(Number);      
      const includeMonth = year === currentYear
  
      if (includeMonth) {
        acc.push(monthKey);
      }
  
      return acc;
    }, [] as string[]);

    const aggregatedPieData = this.monthsOfCurrentYear.reduce((acc, month) => {
      this.allMonthsData[month].pieData.forEach(item => {
        // Only extract categories data, exclude surplus and standalone items.
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

    this.aggregatedPieData = Object.keys(aggregatedPieData).map(category => ({
      name: category,
      totalValue: aggregatedPieData[category].total
    }))
  }


  /** Gather the metrics from last N months to populate the sliders initially. */
  getMetricsFromLastNMonths(lastNMonths: number) {
    const currentYear = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth() + 1; // 1-based
    
    /** TODO:
     * - Get metrics of current year. Currently: Getting metrics of last N months for avg calculation.
     * But to setup for tracker, we track the values of current year, not last N months.
     */
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
        // Only extract categories data, exclude surplus and standalone items.
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

    // Populate average values for each category
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
  
    const allCategories = Object.values(ExpenseCategory) as string[]
    
    this.masterSliders = allCategories
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
  }

  /** Get categories details based on name (with system prefix) */
  getCategoriesDetails(categoryName: string) {
    return expenseCategoryDetails[categoryName as ExpenseCategory]
  }


  //#region Stepper Navigation

  openPlanner() {
    this.configFinished = !this.configFinished;
    this.navigateToStep(3);
  }

  navigateToStep(stepIndex: number) {
    if (this.stepper) {
      // If the stepper is available, set the selected index immediately
      this.stepper.selectedIndex = stepIndex;
    } else {
      // If stepper is not available, retry until maxRetries are reached
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => {
          this.navigateToStep(stepIndex);  // Retry navigating
        }, 100);
      } else {
        console.warn('Max retries reached. Could not navigate to step.');
      }
    }
  }

  /** Save essential categories selection on user checkbox change. */
  onEssentialCategoriesChange(event: MatSelectionListChange): void {
    this.saveEssentialCategories(event.source.selectedOptions.selected);
  }

  onNonEssentialCategoriesChange(event: MatSelectionListChange): void {
    this.saveNonEssentialCategories(event.source.selectedOptions.selected);
  }
  
  saveEssentialCategories(categories: MatListOption[]): void {
    this.essentialCategories = categories.map(c => c.value);
  
    // Save essential categories to local storage
    localStorage.setItem('essentialCategories', JSON.stringify(this.essentialCategories));
  
    // Create essential sliders and update master sliders with the correct flag
    this.essentialSliders = this.essentialCategories.map(category => this.createSlider(category, true));
  
    // Merge essential sliders into master sliders, so that essential categories are locked.
    this.masterSliders = [
      ...this.essentialSliders,
      ...this.masterSliders.filter(slider => !this.essentialCategories.includes(slider.name))
    ];
  
    /** Populate non-essential categories for the next step */
    this.nonEssentialCategories = this.allCategories.filter(c => !this.essentialCategories.includes(c));
  }
  
  saveNonEssentialCategories(categories: MatListOption[]): void {
    const includedNonEssential = categories.map(c => c.value);
    this.categoriesToInclude = includedNonEssential; // Only include non-essentials in visible sliders
  
    // Reset visibleSliders and hiddenSliders to avoid appending
    this.visibleSliders = [];
    this.hiddenSliders = [];
  
    // Update the sliders based on essential and inclusion status
    this.masterSliders.forEach(slider => {
      if (slider.isEssential) {
        // Keep essential sliders locked
        slider.locked = true;
        slider.weight = 0.2; // Essentials have lower weight by default
      } else {
        // Non-essential sliders are never locked
        slider.locked = false;
  
        // Adjust weight: higher for included sliders
        slider.weight = includedNonEssential.includes(slider.name) ? 40 : 10;
      }
    });
  
    // Filter master sliders into visible and hidden based on inclusion
    this.visibleSliders = this.masterSliders.filter(slider =>
      !slider.isEssential && includedNonEssential.includes(slider.name)
    );
  
    this.hiddenSliders = this.masterSliders.filter(slider =>
      slider.isEssential || !includedNonEssential.includes(slider.name)
    );
  
    this.syncSliders(); // Ensure the UI reflects changes
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
      weight: isEssential ? 0.2 : 20, // Higher weight for non-essential categories
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


  onPanelClick() {
    this.isCategoriesLoading = true;
  }
  onPanelOpened() {
    this.isCategoriesLoading = false;
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
      this.syncSliders()
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
      this.syncSliders()
      this.saveState(); // Save the reset state to history
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
    this.syncSliders()
  }

  toggleLockAllSliders() {
    this.allSlidersLocked = !this.allSlidersLocked;

    if (this.allSlidersLocked) {
      this.masterSliders.forEach((item) => item.locked = true);
    } else {
      this.masterSliders.forEach((item) => item.locked = false);
    }
    this.syncSliders()
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

  
    // Sync visible sliders with updated values from masterSliders
    this.syncSliders()
  }

  /** Auto adjust sliders. Slider with isEssential = true has less weight => less likely to be changed. */
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
        this.uiService.showSnackBar("No adjustment needed", "OK");
        return;
    }

    // Separate sliders into visible and hidden
    const visibleSliders = this.visibleSliders.filter((item) => !item.locked);
    const hiddenSliders = this.hiddenSliders.filter((item) => !item.locked);

    // Calculate the total weights for visible and hidden sliders
    const visibleWeight = visibleSliders.reduce((sum, item) => sum + item.weight, 0);
    const hiddenWeight = hiddenSliders.reduce((sum, item) => sum + item.weight, 0);
    const totalWeight = visibleWeight + hiddenWeight;

    if (totalWeight === 0) {
        console.error("No adjustable sliders available.");
        this.uiService.showSnackBar("No sliders to adjust", "OK");
        return;
    }

    // Define a priority ratio for visible sliders
    const priorityFactor = 1.5; // Visible sliders get 1.5x the adjustment weight
    const adjustedVisibleWeight = visibleWeight * priorityFactor;
    const adjustedTotalWeight = adjustedVisibleWeight + hiddenWeight;

    // Distribute adjustments to visible sliders
    visibleSliders.forEach((slider) => {
        const adjustment = (adjustedVisibleWeight > 0 ? (slider.weight * priorityFactor / adjustedTotalWeight) : 0) * adjustmentAmount;

        if (adjustment > 0) {
          slider.value += adjustment;
          if (slider.value > (slider.max || 0)) {
              slider.max = slider.value * 1.2; // Extend the max value by 20%
          }
          // Increase slider value but ensure it doesn't exceed its max
          slider.value = Math.min(roundToNearestHundreds(slider.value), slider.max || Infinity);
        } else {
          // Decrease slider value but ensure it doesn't go below its min
          slider.value = Math.max(roundToNearestHundreds(slider.value + adjustment), slider.min || 0);
        }
    });

    // Distribute adjustments to hidden sliders
    hiddenSliders.forEach((slider) => {
        const adjustment = (hiddenWeight > 0 ? (slider.weight / adjustedTotalWeight) : 0) * adjustmentAmount;

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
    this.syncSliders();

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
  
    // Distribute the adjustment based on the weight: higher weight = more effect
    adjustableSliders.forEach((item) => {
      // The adjustment is directly proportional to weight (higher weight -> more adjustment)
      const adjustment = (item.weight / totalWeight) * amount;
  
      // Ensure the adjustment doesn't exceed min or max values
      if (action === "reduce") {
        item.value = Math.max(roundToNearestHundreds(item.value - adjustment), item.min || 0);
      } else if (action === "increase") {
        item.value = Math.min(roundToNearestHundreds(item.value + adjustment), item.max || Infinity);
      }
    });
  }
  

  /** Method to update sliders to reflect their correct values in the UI. */
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

  /** Method to track all visible sliders */
  trackVisibleSliders(showNoti: boolean = false, noti: string = 'Categories Tracked!') {
    // Map tracking data for all visible sliders
    const trackingData: Tracker[] = this.visibleSliders.map(slider => {
      const matchingCategory = this.aggregatedPieData.find(item => item.name === slider.name);
      const currentSpending = matchingCategory?.totalValue || 0;
      const targetSpending = slider.value * 12; // Annual target based on slider value
      const percentageSpent = targetSpending === 0 ? 0 : (currentSpending / targetSpending) * 100;
  
      return {
        name: slider.name,
        currentSpending,
        targetSpending,
        percentageSpent,
      };
    });
  
    // Save the tracking data to a service
    this.trackingService.saveTrackingData(trackingData);
    if (showNoti) {
      this.uiService.showSnackBar(noti);
    }
  }
  



  /** To pre-select the non essential categories in template */
  get visibleSlidersName(): string[] {
    return this.visibleSliders.map((item) => item.name);
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