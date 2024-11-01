export interface UserDefinedLink {
    type: EntryType;  // Type of the entry
    target: string;   // The name of the current node
    value: number;    // Amount associated with the link
    source?: ExpenseCategory;  // Optional source node (only for expenses)
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