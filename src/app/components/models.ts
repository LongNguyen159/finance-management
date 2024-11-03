export interface UserDefinedLink {
    type: EntryType;  // Type of the entry
    target: string;   // The name of the current node
    value: number;    // Amount associated with the link
    source?: ExpenseCategory;  // Optional source node (only for expenses)
    isFixCost?: boolean;  // Optional flag to indicate fix cost
    demo?: boolean;   // Optional flag to indicate demo data
}

export enum EntryType {
  Income = 'income',
  Expense = 'expense',
  Tax = 'tax'
}


export const SYSTEM_PREFIX = '__system/category__'

export enum ExpenseCategory {
  Housing = `Housing@${SYSTEM_PREFIX}`,
  Groceries = `Groceries@${SYSTEM_PREFIX}`,
  Restaurants = `Restaurants@${SYSTEM_PREFIX}`,
  Shopping = `Shopping@${SYSTEM_PREFIX}`,
  Education = `Education@${SYSTEM_PREFIX}`,
  Savings = `Savings & Investments@${SYSTEM_PREFIX}`,
  Health = `Health & Fitness@${SYSTEM_PREFIX}`,
  Entertainment = `Entertainment@${SYSTEM_PREFIX}`,
  Hobby = `Hobbies@${SYSTEM_PREFIX}`,
  Commute = `Commute & Transport@${SYSTEM_PREFIX}`,
  Utils = `Utilities@${SYSTEM_PREFIX}`,
  Other = `Other@${SYSTEM_PREFIX}`
}

export interface ExpenseCategoryDetails {
  label: string;
  value: string;
  icon?: string;
}

export const expenseCategoryDetails: { [key in ExpenseCategory]: ExpenseCategoryDetails } = {
  [ExpenseCategory.Housing]: { label: 'Housing', value: ExpenseCategory.Housing, icon: 'home' },
  [ExpenseCategory.Groceries]: { label: 'Groceries', value: ExpenseCategory.Groceries, icon: 'shopping_cart' },
  [ExpenseCategory.Restaurants]: { label: 'Restaurants', value: ExpenseCategory.Restaurants, icon: 'restaurant' },
  [ExpenseCategory.Shopping]: { label: 'Shopping', value: ExpenseCategory.Shopping, icon: 'shopping_bag' },
  [ExpenseCategory.Education]: { label: 'Education', value: ExpenseCategory.Education, icon: 'school' },
  [ExpenseCategory.Savings]: { label: 'Savings & Investments', value: ExpenseCategory.Savings, icon: 'savings' },
  [ExpenseCategory.Health]: { label: 'Health & Fitness', value: ExpenseCategory.Health, icon: 'fitness_center' },
  [ExpenseCategory.Entertainment]: { label: 'Entertainment', value: ExpenseCategory.Entertainment, icon: 'movie' },
  [ExpenseCategory.Hobby]: { label: 'Hobbies', value: ExpenseCategory.Hobby, icon: 'palette' },
  [ExpenseCategory.Commute]: { label: 'Commute & Transport', value: ExpenseCategory.Commute, icon: 'commute' },
  [ExpenseCategory.Utils]: { label: 'Utilities', value: ExpenseCategory.Utils, icon: 'build' },
  [ExpenseCategory.Other]: { label: 'Other', value: ExpenseCategory.Other, icon: 'more_horiz' }
};

export interface DateChanges {
  previousMonth: Date;
  currentMonth: Date;
}



export interface SankeyNode {
    name: string;
    value: number;
  }
  
  export interface SankeyLink {
    source: string;   // Source node
    target: string;   // Target node
    value: number;    // Value of the link
  }
  
export interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

export interface PieData {
  name: string
  value: number
}