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
    this.budget.set(budgets);
    localStorage.setItem(this.storageKey, JSON.stringify(budgets));
  }
}
