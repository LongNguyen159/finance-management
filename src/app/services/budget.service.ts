import { Injectable } from '@angular/core';
import { Budget } from '../components/models';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly storageKey = 'budgets';

  

  constructor() { }


  getBudgets(): Budget[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  saveBudgets(budgets: Budget[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(budgets));
  }
}
