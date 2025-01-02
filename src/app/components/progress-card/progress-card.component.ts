import { Component, EventEmitter, inject, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TrackingService } from '../../services/tracking.service';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { ColorService } from '../../services/color.service';
import { formatBigNumber, getCurrentYearMetrics, removeSystemPrefix } from '../../utils/utils';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseCategory, expenseCategoryDetails, RoutePath, Tracker } from '../models';
import { CurrencyService } from '../../services/currency.service';
import { MatButtonModule } from '@angular/material/button';
import { UiService } from '../../services/ui.service';
import { ConfirmDialogData } from '../dialogs/confirm-dialog/confirm-dialog.component';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-progress-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './progress-card.component.html',
  styleUrl: './progress-card.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ProgressCardComponent extends BasePageComponent implements OnInit {

  @Output() navigateToSmartBudgeter = new EventEmitter<boolean>(false)

  trackingService = inject(TrackingService);
  colorService = inject(ColorService)
  currencyService = inject(CurrencyService)
  uiService = inject(UiService)
  dataService = inject(DataService)

  RoutePath = RoutePath

  aggregatedTrackers: Tracker


  ngOnInit(): void {
    this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe(allMonthsData => {
      const aggregatedCategoriesOfCurrentYear = getCurrentYearMetrics(allMonthsData)
      
      this.trackingService.cleanupTrackingCategories(aggregatedCategoriesOfCurrentYear) // Cleanup data for categories that are no longer present in the current year
      this.trackingService.updateMultipleCurrentSpendings(aggregatedCategoriesOfCurrentYear) // Update current spending for all categories
    })

    this.trackingService.trackingCategories$.pipe(takeUntil(this.componentDestroyed$)).subscribe(trackingCategories => {
      this.aggregatedTrackers = this.aggregateTrackers(trackingCategories)
    })
  }

  aggregateTrackers(trackers: Tracker[]): Tracker {
    const totalCurrentSpending = trackers.reduce((sum, tracker) => sum + tracker.currentSpending, 0);
    const totalTargetSpending = trackers.reduce((sum, tracker) => sum + tracker.targetSpending, 0);
  
    const percentageSpent = totalTargetSpending > 0 
      ? (totalCurrentSpending / totalTargetSpending) * 100 
      : 0;
  
    return {
      name: "Total Spending",
      currentSpending: totalCurrentSpending,
      targetSpending: totalTargetSpending,
      percentageSpent: percentageSpent
    };
  }

  /** Calculate and clamp the percentageSpent to a maximum of 100 */
  clampedPercentageSpent(percentage: number): number {
    return Math.min(percentage, 100);
  }

  removeSystemPrefix(name: string) {
    return removeSystemPrefix(name);
  }

  getCategoryIconDetails(category: string) {
    return expenseCategoryDetails[category as ExpenseCategory];
  }

  deleteCategory(category: string) {
    const dialogData: ConfirmDialogData = {
      title: `Are you sure you want to delete tracker for ${removeSystemPrefix(category)}?`,
      message: `You can set up a new tracker for this category in Smart Budget Planner anytime.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmColor: 'warn'
    }
    const dialogRef = this.uiService.openConfirmDialog(dialogData)

    dialogRef.subscribe(result => {
      if (result == true) {
        this.trackingService.removeTrackingData(category);
      }
    })
    
  }

  navigateToBudgetPlanner() {
    this.navigateToSmartBudgeter.emit(true)
  }

  formatBigNumber(number: number) {
    return formatBigNumber(number, this.currencyService.getCurrencySymbol())
  }

}
