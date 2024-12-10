import { Component, inject, OnInit } from '@angular/core';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { DataService } from '../../services/data.service';
import { takeUntil } from 'rxjs';
import { BudgetSlider, MonthlyData, SYSTEM_PREFIX } from '../models';
import { CommonModule } from '@angular/common';
import {MatSliderModule} from '@angular/material/slider';
import { removeSystemPrefix, roundToNearestHundreds } from '../../utils/utils';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-budget-slider',
  standalone: true,
  imports: [
    CommonModule,
    MatSliderModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule

  ],
  templateUrl: './budget-slider.component.html',
  styleUrl: './budget-slider.component.scss'
})
export class BudgetSliderComponent extends BasePageComponent implements OnInit{
  dataService = inject(DataService)

  
  allMonthsData: MonthlyData
  currentDate: Date = new Date();
  filteredMonthsByYear: { [key: string]: string[] } = {};
  filteredMonths: string[] = [];


  MONTHS_TO_CALCULATE_AVG = 12
  sliders: BudgetSlider[] = [];
  averagePieData: { name: string, averageValue: number }[] = [];

  averageIncome: number = 0
  averageExpense: number = 0


  totalIncome: number = 2000
  targetSurplus: number = 200

  totalExpenses: number = 0
  private initialSliders: any[] = []; // To store the initial slider values

  
  ngOnInit(): void {
    this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe((allMonthsData: MonthlyData) => {
      this.allMonthsData = allMonthsData;
      this.getMetricsFromLastNMonths(this.MONTHS_TO_CALCULATE_AVG);
    })  
  }


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

    console.log('coresponding month data:', this.filteredMonths.map(month => this.allMonthsData[month]));
  
    const totalUsableIncome = this.filteredMonths.reduce((acc, month) => {
      return acc + this.allMonthsData[month].totalUsableIncome;
    }, 0);
  
    const averageExpenses = totalExpenses / this.filteredMonths.length;
    const averageUsableIncome = totalUsableIncome / this.filteredMonths.length;
  

    this.averageExpense = roundToNearestHundreds(averageExpenses)

    this.totalExpenses = roundToNearestHundreds(averageExpenses)

    this.averageIncome = roundToNearestHundreds(averageUsableIncome)


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
      name: removeSystemPrefix(name),
      averageValue: Math.round((aggregatedPieData[name].total / this.MONTHS_TO_CALCULATE_AVG) * 100) / 100
    }));
    this.populateSliders();
  }

  recalculateExpenses() {
    this.totalExpenses = roundToNearestHundreds(this.sliders.reduce((acc, item) => acc + item.value, 0));
  }


  populateSliders() {
    // Populate sliders and store initial values
    this.sliders = this.averagePieData.map(data => ({
      name: data.name,
      value: roundToNearestHundreds(data.averageValue),
      max: this.totalIncome,
      weight: 1 // Default weight, can be user-adjusted
    }));
  
    // Store the initial slider values
    this.initialSliders = JSON.parse(JSON.stringify(this.sliders)); // Deep copy to preserve original values
    console.log('Sliders:', this.sliders);
  }

  resetSliders(): void {
    if (this.initialSliders.length === 0) {
      console.error("Initial sliders not available for reset");
      return;
    }
    // Restore sliders to their initial state
    this.sliders = JSON.parse(JSON.stringify(this.initialSliders)); // Deep copy to avoid reference issues
    this.recalculateExpenses()
    console.log('Sliders reset to initial values:', this.sliders);

  }

  adjustSliders(name: string, newValue: number): void {
    // Find the item to update
    const targetIndex = this.sliders.findIndex((item) => item.name === name);
    if (targetIndex === -1) {
      console.error("Item not found");
      return;
    }
  
    // Update the target value
    const originalValue = this.sliders[targetIndex].value;
    this.sliders[targetIndex].value = roundToNearestHundreds(newValue);
  
    // Calculate the new total sum
    const currentSum = this.sliders.reduce((sum, item) => sum + item.value, 0);
  
    this.totalExpenses = roundToNearestHundreds(currentSum);
  
    const maxSum = this.totalIncome - this.targetSurplus;
  
    // Check if the sum exceeds the max allowed value
    if (currentSum > maxSum) {
      const excess = currentSum - maxSum;
  
      // Calculate total weight of items to adjust
      const totalWeight = this.sliders
        .filter((_, index) => index !== targetIndex) // Exclude the updated item
        .reduce((sum, item) => sum + item.weight, 0);
  
      if (totalWeight === 0) {
        console.error("Cannot adjust other items because their weights sum to 0");
        this.sliders[targetIndex].value = roundToNearestHundreds(originalValue); // Revert to the original value
        return;
      }
  
      // Adjust other values proportionally
      this.sliders.forEach((item, index) => {
        if (index !== targetIndex) {
          const adjustment = (item.weight / totalWeight) * excess;
          item.value = Math.max(roundToNearestHundreds(item.value - adjustment), 0); // Ensure no negative values
        }
      });
  
      // Recheck to ensure the sum is within the limit due to rounding
      const adjustedSum = this.sliders.reduce((sum, item) => sum + item.value, 0);
      if (adjustedSum > maxSum) {
        console.warn("Adjustment could not fully bring the total under the maximum");
      }
    }
  }
  
  


}
