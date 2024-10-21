export interface UserDefinedLink {
    type: EntryType;  // Type of the entry
    target: string;   // The name of the current node
    value: number;    // Amount associated with the link
    source?: string;  // Optional source node (only for expenses)
}

export enum EntryType {
  Income = 'income',
  Expense = 'expense',
  Tax = 'tax'
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