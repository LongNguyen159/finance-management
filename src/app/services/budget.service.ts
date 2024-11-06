import { Injectable, signal } from '@angular/core';
import { Budget } from '../components/models';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly storageKey = 'budgets';

  budget = signal<Budget[]>(this.getBudgets());

  

  constructor() { }


  getBudgets(): Budget[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  saveBudgets(budgets: Budget[]) {
    // Filter out budgets with no value or value <= 0
    const validBudgets = budgets.filter((budget: Budget) => budget.value && budget.value > 0);
    this.budget.set(validBudgets) 
    localStorage.setItem(this.storageKey, JSON.stringify(validBudgets));
  }
}
