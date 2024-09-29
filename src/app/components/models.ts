export interface SankeyLink {
    source: string;
    target: string;
    value: number;
    type: string;
}


export interface UserDefinedLink {
    type: 'income' | 'expense' | 'tax';
    target: string;   // The name of the current node
    value: number;    // Amount associated with the link
    source?: string;  // Optional source node (only for expenses)
}