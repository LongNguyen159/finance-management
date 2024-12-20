import { Component, EventEmitter, inject, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TrackingService } from '../../services/tracking.service';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { ColorService } from '../../services/color.service';
import { removeSystemPrefix } from '../../utils/utils';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseCategory, expenseCategoryDetails, RoutePath } from '../models';
import { CurrencyService } from '../../services/currency.service';
import { MatButtonModule } from '@angular/material/button';
import { UiService } from '../../services/ui.service';
import { ConfirmDialogData } from '../dialogs/confirm-dialog/confirm-dialog.component';
import { RouterModule } from '@angular/router';


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

  RoutePath = RoutePath


  ngOnInit(): void {
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

}
