import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ExpenseCategory, ExpenseCategoryDetails, expenseCategoryDetails } from '../../models';
import { MatListModule, MatListOption, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ColorService } from '../../../services/color.service';
import { TrackingService } from '../../../services/tracking.service';

@Component({
  selector: 'app-tracker-selector-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    CommonModule,
    MatListModule,
    MatIconModule
  ],
  templateUrl: './tracker-selector-dialog.component.html',
  styleUrl: './tracker-selector-dialog.component.scss'
})
export class TrackerSelectorDialogComponent {
  allCategories = Object.values(expenseCategoryDetails)
  colorService = inject(ColorService)
  dialogRef = inject(MatDialogRef)
  trackingService = inject(TrackingService)

  isAllSelected = false;

  /** Get Signal from service, populate selected categories with signal's value */
  selectedCategories: string[] = this.trackingService.categoriesToTrack()

  constructor() {
    effect(() => {
      this.updateSelectedCategories()
    })
  }

  
  updateSelectedCategories() {
    this.selectedCategories = this.trackingService.categoriesToTrack()
    this.isAllSelected = this.selectedCategories.length === this.allCategories.length
  }

  /** Save the selected categories option to `selectedCategories` */
  onCategorySelection(options: MatListOption[]) {
    this.selectedCategories = options.map(option => option.value as ExpenseCategory)
    this.trackingService.categoriesToTrack.set(this.selectedCategories)
  }

  toggleSelectAll(categoryList: MatSelectionList): void {
    if (this.isAllSelected) {
      // Deselect all
      this.selectedCategories = [];
      categoryList.deselectAll();
      this.trackingService.categoriesToTrack.set(this.selectedCategories)
    } else {
      // Select all
      this.selectedCategories = this.allCategories.map(category => category.value);
      categoryList.selectAll();
      this.trackingService.categoriesToTrack.set(this.selectedCategories)
    }
    this.isAllSelected = !this.isAllSelected;
  }

  onDialogClose() {
    this.dialogRef.close(this.selectedCategories)
  }
}
