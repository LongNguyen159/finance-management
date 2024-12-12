import { Component, inject, OnInit } from '@angular/core';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { DataService } from '../../services/data.service';
import { takeUntil } from 'rxjs';
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
    MatTooltipModule
  ],
  templateUrl: './budget-slider.component.html',
  styleUrl: './budget-slider.component.scss'
})
export class BudgetSliderComponent extends BasePageComponent implements OnInit {
  dataService = inject(DataService)
  colorService = inject(ColorService)
  allMonthsData: MonthlyData
  currentDate: Date = new Date();
  filteredMonthsByYear: { [key: string]: string[] } = {};
  filteredMonths: string[] = [];

  //#region Income/Expense/Surplus
  // Average Income/Expense gathered to populate the sliders on init
  averageIncome: number = 0 // Can be changed by user for more accurate calculations

  // Pie Category data that contains average values to populate sliders on init
  averagePieData: { name: string, averageValue: number }[] = [];

  /** User defined metrics: Income and target surplus.
   * Total expenses are calculated based on the sliders.
   */
  targetSurplus: number = 200

  totalExpenses: number = 0

  MONTHS_TO_CALCULATE_AVG = 12

  calculationBasis: 'monthly' | 'yearly' = 'monthly';
  multiplier: number = 1
  //#endregion

  //#region Sliders
  sliders: BudgetSlider[] = [];
  initialSliders: any[] = []; // To store the initial slider values
  sliderHistory: any[][] = []
  maxHistorySize: number = 15

  autoFit: boolean = false; // Auto-fit sliders to stay within target surplus
  //#endregion
  
  ngOnInit(): void {
    this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe((allMonthsData: MonthlyData) => {
      this.allMonthsData = allMonthsData;
      this.getMetricsFromLastNMonths(this.MONTHS_TO_CALCULATE_AVG);
    })  
  }

  /** Recalculate Metrics and populate the sliders with appropriate values for the selected time frame. */
  onCalculationBasisChange(option: 'monthly' | 'yearly') {
    this.calculationBasis = option
    this.multiplier = option === 'yearly' ? 12 : 1;
    this.getMetricsFromLastNMonths(this.MONTHS_TO_CALCULATE_AVG);
  }

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
    this.totalExpenses = roundToNearestHundreds(this.sliders.reduce((acc, item) => acc + item.value, 0));
  }

  /** Populate Sliders with initial values (untouched).
   * The intial values come from average from the last N months.
   */
  populateSliders() {
    const totalCategoryValues = this.averagePieData.reduce((sum, data) => sum + data.averageValue, 0);
  
    this.sliders = this.averagePieData.map(category => {

      const percentage = category.averageValue / totalCategoryValues; // Relative size of category

      // Scaled max: Choose income % or average value * 1.5, whichever is higher
      const dynamicMax = Math.max(this.averageIncome * percentage * 3, (category.averageValue + 1) * 1.5); 

      const categoryDetails = expenseCategoryDetails[category.name as ExpenseCategory];

      return {
        name: removeSystemPrefix(category.name),
        value: roundToNearestHundreds(category.averageValue),
        min: 0,
        max: roundToNearestHundreds(dynamicMax), // Dynamic max scaling

        locked: false, // Default unlocked
        weight: 1, // Default weight, can be user-adjusted

        icon: categoryDetails.icon,
        colorDark: categoryDetails.colorDark,
        colorLight: categoryDetails.colorLight,
      };
    });
  
    this.initialSliders = JSON.parse(JSON.stringify(this.sliders)); // Deep copy for reset
    this.saveState(); // Save initial state
    console.log('Sliders:', this.sliders);
  }

  //#region Save/Undo/Reset
  /** Save current state of sliders into history buffer, this allows for `undo` to work. */
  saveState(): void {
    // Deep copy the current sliders state
    const currentState = JSON.parse(JSON.stringify(this.sliders));
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
      this.sliders = JSON.parse(JSON.stringify(previousState)); // Deep copy
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
    const currentState = JSON.stringify(this.sliders);
    if (currentState !== JSON.stringify(resetState)) {
      this.sliders = resetState; // Apply the reset state
      this.saveState(); // Save the reset state to history
      this.recalculateExpenses();
    } else {
      console.info("Sliders are already in the reset state, no need to save again.");
    }
  }  
  //#endregion

  //#region Slider adjustments

  toggleLockSlider(sliderName: string) {
    const targetIndex = this.sliders.findIndex((item) => item.name === sliderName);
    if (targetIndex === -1) {
      console.error("Item not found");
      return;
    }
    this.sliders[targetIndex].locked = !this.sliders[targetIndex].locked;
  }

  /** IMPORTANT: Remember to save slider state on slider changes. */
  /** Modify the min value of the slider */
  adjustMinValue(sliderName: string, minValue: string): void {
    this.saveState() // Save the current state before making changes

    /** Input is in string value, parse to float values */
    const min = parseFloat(minValue);
    // Find the item to update
    const targetIndex = this.sliders.findIndex((item) => item.name === sliderName);
    if (targetIndex === -1) {
      console.error("Item not found");
      return;
    }
  
    // Update the target value
    this.sliders[targetIndex].min = min;
  }

  /** Readjust the sliders so that the total stays below target surplus defined by user. */
  adjustSliders(name: string, newValue: number): void {
    // Save the current state before making changes
    this.saveState();

    // Find the item to update
    const targetIndex = this.sliders.findIndex((item) => item.name === name);
    if (targetIndex === -1) {
      console.error("Item not found");
      return;
    }

    // Update the target value but respect min value
    const slider = this.sliders[targetIndex];
    const originalValue = slider.value;
    slider.value = Math.max(roundToNearestHundreds(newValue), slider.min || 0); // Ensure value >= min

    // Calculate the new total sum
    const currentSum = this.sliders.reduce((sum, item) => sum + item.value, 0);
    this.totalExpenses = roundToNearestHundreds(currentSum);

    const maxSum = this.averageIncome - this.targetSurplus;

    // Check if the sum exceeds the max allowed value
    if (currentSum > maxSum) {
      const excess = currentSum - maxSum;

      // Calculate total weight of items to adjust (excluding locked sliders)
      const totalWeight = this.sliders
        .filter((_, index) => index !== targetIndex && !this.sliders[index].locked) // Exclude updated and locked items
        .reduce((sum, item) => sum + item.weight, 0);

      if (totalWeight === 0) {
        console.error("Cannot adjust other items because their weights sum to 0 or all are locked");
        slider.value = roundToNearestHundreds(originalValue); // Revert to the original value
        return;
      }

      // Adjust other values proportionally (downwards)
      this.sliders.forEach((item, index) => {
        if (index !== targetIndex && !item.locked) {
          const adjustment = (item.weight / totalWeight) * excess;
          item.value = Math.max(
            roundToNearestHundreds(item.value - adjustment),
            item.min || 0 // Respect min value
          );
        }
      });
    } else if (this.autoFit && currentSum < maxSum) {
      // Adjust other sliders up to stay closer to maxSum
      const deficit = maxSum - currentSum;

      // Calculate total weight of items to adjust (excluding locked sliders)
      const totalWeight = this.sliders
        .filter((_, index) => index !== targetIndex && !this.sliders[index].locked) // Exclude updated and locked items
        .reduce((sum, item) => sum + item.weight, 0);

      if (totalWeight > 0) {
        // Adjust other values proportionally (upwards)
        this.sliders.forEach((item, index) => {
          if (index !== targetIndex && !item.locked) {
            const adjustment = (item.weight / totalWeight) * deficit;
            item.value = Math.min(
              roundToNearestHundreds(item.value + adjustment),
              item.max || maxSum // Respect max value, if defined
            );
          }
        });
      }
    }

    // Recheck to ensure the sum is within the limit due to rounding
    const adjustedSum = this.sliders.reduce((sum, item) => sum + item.value, 0);
    if (adjustedSum > maxSum) {
      console.warn("Adjustment could not fully bring the total under the maximum");
    }
  }
  //#endregion

  //#region Formatting
  formatBigNumbers(value: number): string {
    return formatBigNumber(value);
  }

  formatBigNumbersFrom1K(value: number): string {
    return formatBigNumber(value, '', 1000);
  }

  //#endregion
}