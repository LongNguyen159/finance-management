import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Budget, ExpenseCategory, expenseCategoryDetails } from '../models';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ColorService } from '../../services/color.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { BudgetService } from '../../services/budget.service';
import { BudgetDialogComponent } from '../dialogs/budget-dialog/budget-dialog.component';
import { UiService } from '../../services/ui.service';
import { removeSystemPrefix } from '../../utils/utils';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './budget-list.component.html',
  styleUrl: './budget-list.component.scss'
})
export class BudgetListComponent implements OnInit{
  colorService = inject(ColorService)
  budgetService = inject(BudgetService)
  uiService = inject(UiService)
  expenseCategoryDetails = Object.values(expenseCategoryDetails);
  currencyService = inject(CurrencyService)

  budgets: Budget[] = [];

  hoveredCategory: string | null = null;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.budgets = this.budgetService.getBudgets()
  }

  onMouseEnter(category: string) {
    this.hoveredCategory = category;
  }

  onMouseLeave() {
    this.hoveredCategory = null;
  }


  onBudgetClick(category: string) {
    const _category = category as ExpenseCategory;
    const categoryDetails = this.expenseCategoryDetails.find(cat => cat.value === category);

    const currentBudget = this.getCurrentBudget(_category);

    const dialogRef = this.dialog.open(BudgetDialogComponent, {
      width: '500px',
      height: '300px',
      data: { categoryLabel: categoryDetails?.label || '', value: currentBudget }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.updateBudget(_category, result);
      }
    });
  }

  getBudgetValue(category: string): string {
    const budgetValue = this.budgets.find(budget => budget.category === category)?.value;
    return budgetValue ? this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency()) + budgetValue.toLocaleString('en-US') : ' _';
  }
  


  getCurrentBudget(category: ExpenseCategory): number {
    const budgets = this.budgetService.getBudgets();
    return budgets.find(budget => budget.category === category)?.value || 0;
  }

  updateBudget(category: ExpenseCategory, value: number) {
    const budgetIndex = this.budgets.findIndex(budget => budget.category === category);

    if (budgetIndex >= 0) {
      this.budgets[budgetIndex].value = value;
    } else {
      this.budgets.push({ category, value });
    }

    this.budgetService.saveBudgets(this.budgets);
    if (value === 0 || value == null) {
      this.uiService.showSnackBar(`Removed budget for ${removeSystemPrefix(category)}`, 'OK', 3000);
    } else {
      this.uiService.showSnackBar(`Budget for ${removeSystemPrefix(category)} set!`, 'OK', 3000);
    }
  }
}
