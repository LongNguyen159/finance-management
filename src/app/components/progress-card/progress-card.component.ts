import { Component, inject, OnInit } from '@angular/core';
import { TrackingService } from '../../services/tracking.service';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { ColorService } from '../../services/color.service';
import { removeSystemPrefix } from '../../utils/utils';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseCategory, expenseCategoryDetails } from '../models';
import { CurrencyService } from '../../services/currency.service';


@Component({
  selector: 'app-progress-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule
  ],
  templateUrl: './progress-card.component.html',
  styleUrl: './progress-card.component.scss'
})
export class ProgressCardComponent extends BasePageComponent implements OnInit {
  trackingService = inject(TrackingService);
  colorService = inject(ColorService)
  currencyService = inject(CurrencyService)


  ngOnInit(): void {
    this.trackingService.trackingData$.pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
      console.log('Received updated tracking data:', data);
    })
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

}
