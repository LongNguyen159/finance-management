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


export enum ExpenseCategory {
  Housing = 'Housing@category',
  Groceries = 'Groceries@category',
  Restaurants = 'Restaurants@category',
  Shopping = 'Shopping@category',
  Education = 'Education@category',
  Savings = 'Savings & Investments@category',
  Health = 'Health & Fitness@category',
  Entertainment = 'Entertainment@category',
  Hobby = 'Hobbies@category',
  Commute = 'Commute & Transport@category',
  Utils = 'Utilities@category',
  Other = 'Other@category'
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