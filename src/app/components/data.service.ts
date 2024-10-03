import { inject, Injectable } from '@angular/core';
import { SankeyData, SankeyLink, SankeyNode, UserDefinedLink } from './models';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { InputDialogComponent } from './input-dialog/input-dialog.component';



export interface ProcessedOutputData {
    sankeyData: SankeyData;
    totalUsableIncome: number;
    totalExpenses: number;
    remainingBalance: string;
    pieData: any;
}

export interface TreeNode {
    name: string;
    value: number;
    children: TreeNode[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  sankeyData: SankeyData = {
    nodes: [],
    links: []
  }
  remainingBalance: string = '-';
  processedData: ProcessedOutputData = {
    sankeyData: this.sankeyData,
    totalUsableIncome: 0,
    totalExpenses: 0,
    remainingBalance: this.remainingBalance,
    pieData: []
  }

  processedData$ = new BehaviorSubject<ProcessedOutputData>(this.processedData)

  demoLinks: UserDefinedLink[] = [
    { type: 'income', target: 'Main Salary', value: 2200 },
    { type: 'income', target: 'Side hustle', value: 800 },
    { type: 'tax', target: 'Taxes', value: 220},
    { type: 'expense', target: 'Housing', value: 800},
    { type: 'expense', target: 'Rent', value: 500, source: 'Housing'},
    { type: 'expense', target: 'Operation costs', value: 300, source: 'Housing'},
    { type: 'expense', target: 'Shopping', value: 100},
    { type: 'expense', target: 'Groceries', value: 300},
  ]

  readonly dialog = inject(MatDialog)
  constructor() {
    this.processInputData(this.demoLinks)
  }

    processInputData(userDefinedLinks: UserDefinedLink[]): void {
        const nodesMap = new Map<string, { value: number, type: string }>(); // Map to hold unique nodes and their total values and types
        const links: SankeyLink[] = []; // Array to hold links between nodes
        const incomeNodes: string[] = []; // Track income nodes
        let totalIncomeValue = 0; // Variable to store total income value
        let totalTaxValue = 0; // Variable to store total tax value
        let singleIncome = false; // Flag to check if there is only one income source
        const hasTax = userDefinedLinks.some(link => link.type === 'tax'); // Check if there is any tax link


        // Step 1: Initialize the nodes without adding values yet
        userDefinedLinks.forEach(link => {
            if (!nodesMap.has(link.target)) {
                nodesMap.set(link.target, { value: 0, type: link.type });
            }

            // Step 1.2: Process links to accumulate income, taxes, and expenses
            if (link.type === 'income') {
                incomeNodes.push(link.target);
                nodesMap.get(link.target)!.value += link.value; // Add income only once
            } else if (link.type === 'tax') {
                nodesMap.get(link.target)!.value += link.value;
                totalTaxValue += link.value;
            } else if (link.type === 'expense') {
                if (!link.source) {
                    // Top-level expenses (those without a source)
                    nodesMap.get(link.target)!.value += link.value;
                } else {
                    // Child expenses (those with a source)
                    // nodesMap.get(link.source)!.value = link.value; // Update parent value
                    nodesMap.get(link.target)!.value = link.value; // Update child value
                }
            }
        })


        // Step 2: Aggregate income into "Total Income" node if multiple income sources exist
        if (incomeNodes.length > 1) {
            totalIncomeValue = incomeNodes.reduce((sum, node) => sum + (nodesMap.get(node)?.value || 0), 0);
            nodesMap.set('Total Income', { value: totalIncomeValue, type: 'income' });
        } else if (incomeNodes.length === 1) {
            singleIncome = true; // Only one income source, no need for a "Total Income" node
            totalIncomeValue = nodesMap.get(incomeNodes[0])?.value || 0;
        }

        // Step 3: Handle Usable Income if there's a tax link, otherwise use the full income directly
        const incomeSource = singleIncome ? incomeNodes[0] : 'Total Income';

        if (hasTax) {
            const taxLink = userDefinedLinks.find(link => link.type === 'tax');
            let usableIncome = totalIncomeValue;

            if (taxLink) {
                const taxValue = nodesMap.get(taxLink.target)?.value || 0;
                usableIncome -= taxValue; // Subtract taxes
                nodesMap.set('Usable Income', { value: usableIncome, type: 'income' }); // Set Usable Income node

                // Step 4: Create links from Income to Usable Income and Taxes
                links.push({
                    source: incomeSource,
                    target: taxLink.target,
                    value: taxLink.value
                });

                links.push({
                    source: incomeSource,
                    target: 'Usable Income',
                    value: usableIncome
                });
            }
        }

        

        // Step 4: Create links for individual incomes and expenses (no need to modify nodesMap again)
        userDefinedLinks.forEach(link => {
            if (link.type === 'income') {
                if (!singleIncome) {
                    links.push({
                        source: link.target,
                        target: 'Total Income',
                        value: link.value
                    });
                }
            } else if (link.type === 'expense') {
                const expenseSource = hasTax ? 'Usable Income' : incomeSource;

                links.push({
                    source: link.source || expenseSource, // Use user-defined source or default to income source
                    target: link.target,
                    value: link.value
                });
            }
        });


        // Step 5: Convert nodesMap to an array of nodes (including child nodes)
        const nodes: SankeyNode[] = Array.from(nodesMap.entries()).map(([name, { value }]) => ({ name, value: value }));

        // Step 6: Remove duplicate links
        const uniqueLinks: SankeyLink[] = Array.from(new Set(links.map(link => JSON.stringify(link)))).map(link => JSON.parse(link) as SankeyLink);
 

       // Step 7: Calculate return params
       let pieSeriesData: {name: string, value: number}[] = []

        const totalExpenses = this.getTotalExpensesFromLinks(uniqueLinks, hasTax, incomeNodes.length).totalExpenses;
        const pieData = this.getTotalExpensesFromLinks(uniqueLinks, hasTax, incomeNodes.length).topLevelexpenses;
        const remainingBalance: string = (totalIncomeValue - totalExpenses - totalTaxValue).toLocaleString();
        pieSeriesData.push(...pieData)

        pieSeriesData.push({name: 'Remaining Balance', value: totalIncomeValue - totalExpenses - totalTaxValue})


        // Update return params
        const sankeyData = {
            nodes: nodes,
            links: uniqueLinks
        }
        this.processedData = {
            sankeyData: sankeyData,
            totalUsableIncome: totalIncomeValue - totalTaxValue,
            totalExpenses: totalExpenses,
            remainingBalance: remainingBalance,
            pieData: pieSeriesData
        }

        // Emit the processed data
        this.processedData$.next(this.processedData)
    }


    /** Helper function to determine root node of sankey.
     * Root node will be the income node.
     * Root node will be used as the starting point to build the expense tree.
     */
    private _determineRootNode(links: SankeyLink[], hasTax: boolean, incomeSources: number): string {
        if (hasTax) {
            return "Usable Income";
        } else if (!hasTax && incomeSources === 1) {
            // Find the node that only appears as a source, never as a target
            const sourceNodes = new Set(links.map(link => link.source));
            const targetNodes = new Set(links.map(link => link.target));
    
            for (const source of sourceNodes) {
                if (!targetNodes.has(source)) {
                    return source;
                }
            }
        } else if (!hasTax && incomeSources > 1) {
            return "Total Income";
        }
        return '';
    }

    /** Function to generate a tree structure from Sankey data (source, target, value) => Tree with name, value and children */
    private _buildTree(links: SankeyLink[], rootNodeName: string): TreeNode {
        const nodeMap = new Map<string, TreeNode>();
    
        // Create nodes for all source and target in the links
        links.forEach(link => {
            if (!nodeMap.has(link.source)) {
                nodeMap.set(link.source, { name: link.source, value: 0, children: [] });
            }
            if (!nodeMap.has(link.target)) {
                nodeMap.set(link.target, { name: link.target, value: link.value, children: [] });
            }
    
            // Add the target node as a child of the source node
            const sourceNode = nodeMap.get(link.source)!;
            const targetNode = nodeMap.get(link.target)!;
            sourceNode.children.push(targetNode);
        });
    
        // Return the root node as the entry point to the tree
        return nodeMap.get(rootNodeName)!;
    }


    /** This function uses the tree structure to recursively calculate the total expenses.
     * It compares the value of each node to the sum of its children, and returns the higher value.
     */
    private _calculateNodeExpense(node: TreeNode, isRoot: boolean = false): number {
        /** TODO:
         * - Tooltip for Sankey: show the % of each node compared to total expenses. */
        // If the node has no children, it's a leaf node, so we return its value directly
        if (node.children.length === 0) {
            return node.value;
        }
    
        // Otherwise, recursively calculate the total of all child nodes
        const childrenSum: number = node.children.reduce((sum, child) => {
            return sum + this._calculateNodeExpense(child);
        }, 0);
    
        
        // If this is the root node (income), we only consider the children and ignore the root value
        if (isRoot) {
            return childrenSum;
        }
    
        // For non-root nodes, compare the current node's value to the sum of its children
        const maxExpense: number = Math.max(node.value, childrenSum);
    
    
        return maxExpense;
    }

    getTotalExpensesFromLinks(links: SankeyLink[], hasTax: boolean, incomeSources: number): {totalExpenses: number, topLevelexpenses: any} {
        // Step 1: Determine the root node based on the conditions
        
        const rootNodeName: string = this._determineRootNode(links, hasTax, incomeSources);

        if (!rootNodeName) {
            return {
                totalExpenses: 0,
                topLevelexpenses: []
            }
        }
    
        // Step 2: Build the tree from the root node
        const treeFromRootNode = this._buildTree(links, rootNodeName);

        const pieData = treeFromRootNode.children.map(child => {
            return {
                name: child.name,
                value: child.value
            }
        })
    
        // Step 3: Calculate total expenses from the root
        return {
            totalExpenses: this._calculateNodeExpense(treeFromRootNode, true),
            topLevelexpenses: pieData
        }
    }


    openDialog() {
        const dialogRef = this.dialog.open(InputDialogComponent, {
            width: '1000px',
        });
    
        dialogRef.afterClosed().subscribe(result => {
          console.log(`Dialog result: ${result}`);
        });
    }
    



    getProcessedData() {
        return this.processedData$.asObservable()
    }
}
