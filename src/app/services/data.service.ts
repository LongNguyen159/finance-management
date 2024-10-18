import { Injectable } from '@angular/core';
import { SankeyData, SankeyLink, SankeyNode, UserDefinedLink } from '../components/models';
import { BehaviorSubject } from 'rxjs';
export interface MonthlyData {
    [month: string]: ProcessedOutputData;
}

export interface ProcessedOutputData {
    sankeyData: SankeyData;
    totalUsableIncome: number;
    totalGrossIncome: number;
    totalTax: number;
    totalExpenses: number;
    remainingBalance: string;
    pieData: any;
    rawInput: UserDefinedLink[];
    month: string
}

export interface TreeNode {
    name: string;
    value: number;
    isValueChangedDuringCalc: boolean
    children: TreeNode[];
}

export interface ExpenseData {
    totalExpenses: number;
    topLevelexpenses: any;
    changedExpensesDuringCalculation: TreeNode[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
    monthlyData: MonthlyData = {};
    private sankeyData: SankeyData = {
        nodes: [],
        links: []
    }
    private remainingBalance: string = '-';
    singleMonthEntries: ProcessedOutputData = {
        sankeyData: this.sankeyData,
        totalUsableIncome: -1,
        totalTax: -1,
        totalGrossIncome: -1,
        totalExpenses: -1,
        remainingBalance: this.remainingBalance,
        pieData: [],
        rawInput: [],
        month: ''
    }

    processedSingleMonthEntries$ = new BehaviorSubject<ProcessedOutputData>(this.singleMonthEntries)
    multiMonthEntries$ = new BehaviorSubject<MonthlyData>(this.monthlyData)


    isDemo: boolean = false
    isAdvancedShown: boolean = false

    demoLinks: UserDefinedLink[] = [
        { type: 'income', target: 'Main Salary', value: 2200 },
        { type: 'income', target: 'Side hustle', value: 800 },
        { type: 'tax', target: 'Taxes', value: 1100},
        { type: 'expense', target: 'Housing', value: 800},
        { type: 'expense', target: 'Rent', value: 500, source: 'Housing'},
        { type: 'expense', target: 'WiFi', value: 40, source: 'Housing'},
        { type: 'expense', target: 'Groceries', value: 300},
    ]

    constructor() {
        //#region Retrieve data
        /** Retrieve data from LocalStorage on App start */
        const savedData = this.loadData();
        if (savedData) {
        this.monthlyData = savedData; // Load saved data
        this.processedSingleMonthEntries$.next(this.monthlyData['2024-09']); // Emit saved data
        this.multiMonthEntries$.next(this.monthlyData) // Emit all months data
        } else {
        // Process demo data if no saved data found
        this.processInputData(this.demoLinks, '2024-09', true);
        }
        //#endregion
    }
  
    /** TODO refactor this to utils file.
     * This function is used by charts to get the current date in the format "YYYY-MM-DD".
     * The date will be shown when user exports the chart as image.
     */
    getTodaysDate() {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    }

    //#region: Process Input Data
    processInputData(userDefinedLinks: UserDefinedLink[], month: string, demo: boolean = false): void {
        const nodesMap = new Map<string, { value: number, type: string }>(); // Map to hold unique nodes and their total values and types
        const links: SankeyLink[] = []; // Array to hold links between nodes
        const incomeNodes: string[] = []; // Track income nodes
        let totalIncomeValue = 0; // Variable to store total income value
        let totalTaxValue = 0; // Variable to store total tax value
        let singleIncome = false; // Flag to check if there is only one income source
        const hasTax = userDefinedLinks.some(link => link.type === 'tax'); // Check if there is any tax link

        /** Demo flag: Only set to true when the app loads for the first time to show our demo
         * graph for first time users.
         */
        if (demo) {
            this.isDemo = true;
        } else {
            this.isDemo = false;
        }


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
                    nodesMap.get(link.target)!.value = link.value; // Update child value
                }
            }
        })

        //#region: Handle Income & Taxes
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
        const taxLink = userDefinedLinks.find(link => link.type === 'tax');

        if (hasTax && taxLink) {
            let usableIncome = totalIncomeValue;
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
        //#endregion


        //#region: Handle Expenses
        // Default root node for the sankey chart
        const expenseSource = hasTax ? 'Usable Income' : incomeSource;

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
                const sourceNode = link.source || expenseSource;
        
                // Check if the source node exists in the nodesMap; if not, use the default expenseSource
                const isSourceValid: boolean = nodesMap.has(sourceNode)
                const validSource = isSourceValid ? sourceNode : expenseSource;
                if (!isSourceValid) {
                    link.source = '';
                }
        
                links.push({
                    source: validSource, // Use either the user-defined source or the default expenseSource
                    target: link.target,
                    value: link.value
                });
            }
        });

        //#endregion


        //#region: Handle Return params
        // Step 5: Convert nodesMap to an array of nodes (including child nodes)
        const nodes: SankeyNode[] = Array.from(nodesMap.entries()).map(([name, { value }]) => ({ name, value: value }));

        // Step 6: Remove duplicate links
        const uniqueLinks: SankeyLink[] = Array.from(new Set(links.map(link => JSON.stringify(link)))).map(link => JSON.parse(link) as SankeyLink);
 

       // Step 7: Calculate return params
       /** Pie data will be generated based on Tree Structure generated from Sankey.
        * Not from Sankey links.
        * 
        * => If you want to modify pie chart data, modify tree structure.
        */
       let pieSeriesData: {name: string, value: number}[] = []

        const { totalExpenses, topLevelexpenses: pieData, changedExpensesDuringCalculation: changedExpensesDuringCalculation } = this._getExpensesData(uniqueLinks, hasTax, incomeNodes.length);
        const remainingBalance: number = (totalIncomeValue - totalExpenses - totalTaxValue)

        pieSeriesData = [
            ...pieData,
            { name: 'Remaining Balance', value: remainingBalance },
        ];
        // const updatedRawInput: UserDefinedLink[] = this._updateUserInput(userDefinedLinks, changedExpensesDuringCalculation);

        let updatedRawInput: UserDefinedLink[] = userDefinedLinks; // Default to original input

        // Update raw input if necessary
        if (changedExpensesDuringCalculation.length > 0) {
            updatedRawInput = this._updateUserInput(userDefinedLinks, changedExpensesDuringCalculation);
        }

        // Step 1: Update Sankey nodes and links based on updatedRawInput
        const updatedNodes = nodes.map(node => {
            const updatedNode = updatedRawInput.find(link => link.target === node.name);
            return updatedNode ? { ...node, value: updatedNode.value } : node; // Update value or leave as is
        });

        // const updatedLinks = links.map(link => {
        //     const updatedLink = updatedRawInput.find(l => l.source === link.source && l.target === link.target);
        //     return updatedLink ? { ...link, value: updatedLink.value } : link; // Update value or leave as is
        // });
        const updatedLinks = links.map(link => {
            const updatedLink = updatedRawInput.find(l => l.target === link.target);
            return updatedLink ? { ...link, value: updatedLink.value } : link; // Update value or leave as is
        });

        this.monthlyData[month] = {
            sankeyData: { nodes: updatedNodes, links: updatedLinks },
            totalUsableIncome: totalIncomeValue - totalTaxValue,
            totalGrossIncome: totalIncomeValue,
            totalTax: totalTaxValue,
            totalExpenses: totalExpenses,
            remainingBalance: remainingBalance.toLocaleString(),
            pieData: pieSeriesData,
            rawInput: updatedRawInput,
            month: month
        };

        // Emit the processed data
        this.processedSingleMonthEntries$.next(this.monthlyData[month]) // emit single month data
        this.multiMonthEntries$.next(this.monthlyData) // emit multi month data
        this.isDemo = false; // Reset demo flag

        this.saveData()

        //#endregion
    }

    private _updateUserInput(oldInput: UserDefinedLink[], changedExpenses: TreeNode[]): UserDefinedLink[] {
        return oldInput.map(link => {
            // Check if the current link's target matches any of the changed expenses
            const updatedExpense = changedExpenses.find(node => node.name === link.target);
            // If it matches, return a new link object with the updated value; otherwise, return the original link
            return updatedExpense ? { ...link, value: updatedExpense.value } : link;
        });
    }

    /** Save user data in localStorage. Data will be retrieved on app Init. */
    private saveData() {
        const nonEmptyMonthlyData = Object.keys(this.monthlyData).reduce((result, month) => {
            const data = this.monthlyData[month];
            // Check if the data contains meaningful entries (you can adjust conditions as needed)
            if (data.rawInput.length > 0 || data.totalGrossIncome > 0 || data.totalExpenses > 0) {
                result[month] = data; // Only keep non-empty months
            }
            return result;
        }, {} as MonthlyData);
    
        localStorage.setItem('monthlyData', JSON.stringify(nonEmptyMonthlyData));
    }

    // Load data from LocalStorage
    loadData(): MonthlyData | null {
        const saved = localStorage.getItem('monthlyData');
        return saved ? JSON.parse(saved) as MonthlyData: null;
    }

    getAllMonthsData() {
        return this.multiMonthEntries$.asObservable()
    }

    /** Only keep data of last X years in local storage. 
     * Local Storage limits data to 5MB.
     */
    private cleanUpLocalStorage() {
        const now = new Date();
        const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth());
        Object.keys(localStorage).forEach(key => {
          if (key.match(/^\d{4}-\d{2}$/)) {  // Checks if key matches "YYYY-MM" format
            const date = new Date(key);
            if (date < threeYearsAgo) {
              localStorage.removeItem(key);
            }
          }
        });
    }

    private clearData() {
        localStorage.removeItem('userFinancialData');
        console.log('User data cleared from LocalStorage');
    }

    //#endregion


    //#region Create Tree from Sankey
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
                nodeMap.set(link.source, { name: link.source, value: 0, children: [], isValueChangedDuringCalc: false });
            }
            if (!nodeMap.has(link.target)) {
                nodeMap.set(link.target, { name: link.target, value: link.value, children: [], isValueChangedDuringCalc: false });
            }
    
            // Add the target node as a child of the source node
            const sourceNode = nodeMap.get(link.source)!;
            const targetNode = nodeMap.get(link.target)!;
            sourceNode.children.push(targetNode);
        });
    
        // Return the root node as the entry point to the tree
        return nodeMap.get(rootNodeName)!;
    }

    //#endregion


    //#region Calculate Total Expenses
    /** This function uses the tree structure to recursively calculate the total expenses.
     * It compares the value of each node to the sum of its children, and returns the higher value.
     */
    private _calculateNodeExpense(node: TreeNode, isRoot: boolean = false): number {
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

        if (maxExpense !== node.value) {
            node.isValueChangedDuringCalc = true; // Mark as changed
        } else {
            node.isValueChangedDuringCalc = false; // Mark as unchanged
        }

        node.value = maxExpense; // Update the parent node if children's total is higher.

        return maxExpense;
    }


    private _getExpensesData(links: SankeyLink[], hasTax: boolean, incomeSources: number): ExpenseData {
        // Step 1: Determine the root node based on the conditions
        const rootNodeName: string = this._determineRootNode(links, hasTax, incomeSources);

        if (!rootNodeName) {
            return {
                totalExpenses: 0,
                topLevelexpenses: [],
                changedExpensesDuringCalculation: []
            }
        }
    
        // Step 2: Build the tree from the root node
        let treeFromRootNode: TreeNode = this._buildTree(links, rootNodeName);

        /** Tree might be modified here. So if you want to use the tree structure, use it after these lines. */
        const totalExpenses: number = this._calculateNodeExpense(treeFromRootNode, true);
        const changedNodes: TreeNode[] = this._getChangedNodes(treeFromRootNode);
        
        const pieData = treeFromRootNode.children.map(child => {
            return {
                name: child.name,
                value: child.value
            }
        })

    
        // Step 3: Calculate total expenses from the root
        return {
            totalExpenses: totalExpenses,
            topLevelexpenses: pieData,
            changedExpensesDuringCalculation: changedNodes
        }
    }

    /** Recursively transverse the tree to find the modified nodes. Returns an array of changed nodes. */
    private _getChangedNodes(node: TreeNode, changedNodes: TreeNode[] = []): TreeNode[] {    
        // Check if the node has been modified
        if (node.isValueChangedDuringCalc) {
            changedNodes.push(node); // Add node to changed nodes array
        }
    
        // Recursively check each child
        node.children.forEach(child => {
            this._getChangedNodes(child, changedNodes); // Recursively collect changed nodes
        });
    
        return changedNodes;
    }

    //#endregion

    //#region Dialogs

    toggleAdvanced() {
        this.isAdvancedShown = !this.isAdvancedShown;
    }

    //#endregion
    




    getProcessedData() {
        return this.processedSingleMonthEntries$.asObservable()
    }
}
