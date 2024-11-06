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
  expenseCategoryDetails = Object.values(expenseCategoryDetails);

  budgets: Budget[] = [];

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.budgets = this.budgetService.getBudgets()
  }


  onBudgetClick(category: string) {
    const _category = category as ExpenseCategory;
    const categoryDetails = this.expenseCategoryDetails.find(cat => cat.value === category);
    console.log('Budget clicked', category);

    const currentBudget = this.getCurrentBudget(_category);

    const dialogRef = this.dialog.open(BudgetDialogComponent, {
      data: { categoryLabel: categoryDetails?.label || '', value: currentBudget }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.updateBudget(_category, result);
        console.log('current budgets:', this.budgets)
      }
    });
  }

  getBudgetValue(category: string): string {
    const budgetValue = this.budgets.find(budget => budget.category === category)?.value;
    return budgetValue ? budgetValue.toLocaleString('en-US') : 'Set a Budget';
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
  }
}
