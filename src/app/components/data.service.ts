import { Injectable } from '@angular/core';
import { UserDefinedLink } from './models';


interface Node {
  name: string;
  totalValue: number;
}

interface Link {
  source: string;   // Source node
  target: string;   // Target node
  value: number;    // Value of the link
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  /** TODO:
   * - Create a `financialData` object that group types into income, expenses, and savings.
   * - Generate expenses links from Type of input data.
   * - Generate income links from type of input data.
   * - Generate savings: Savings will be the remaining amount after all expenses and taxes.
   * 
   * 
   * OBJECTIVE:
   * - User enter least amount of input as possible.
   * That means: on our side, we will perform calculations to generate the rest of the data.
   * 
   * 
   * What user need to input: Type of input (income, expenses, savings), and the amount (and an optional
   * parameter called `expandFrom`: Expects a previous node. If specified, new node will be extended from it.).
   */



  userDefinedLinks: UserDefinedLink[] = [
    { type: 'income', target: 'Income', value: 1027 },
    // { type: 'expense', target: 'Net Income', value: 819, source: 'Total Income' },
    { type: 'income', target: 'Roommate Contribution', value: 565 },
    { type: 'tax', target: 'Taxes', value: 208, source: 'Housing' },
    { type: 'expense', target: 'Housing', value: 1096 },
    { type: 'expense', target: 'Groceries', value: 150 },
    { type: 'expense', target: 'Commute', value: 50 },
    { type: 'expense', target: 'Electricity', value: 108, source: 'Housing' },
    { type: 'expense', target: 'Water', value: 35, source: 'Housing' },      
    { type: 'expense', target: 'Rent', value: 833, source: 'Housing' },
    { type: 'expense', target: 'Wifi', value: 40, source: 'Housing' },
    { type: 'expense', target: 'Kitchen', value: 80, source: 'Housing' },
    { type: 'expense', target: 'Sport', value: 20 },
    { type: 'expense', target: 'Sim Card', value: 20 },
    { type: 'expense', target: 'Radio Fees', value: 20 },
  ]

  remainingBalance: number = 0

  constructor() {}


  processInputData(userDefinedLinks: UserDefinedLink[]): { nodes: Node[], links: Link[], remainingBalance: number } {
    const nodesMap = new Map<string, number>(); // Map to hold unique nodes and their total values
    const links: Link[] = []; // Array to hold links between nodes
    const incomeNodes: string[] = []; // Track income nodes
    let totalIncomeValue = 0; // Variable to store total income value
    let totalTaxValue = 0; // Variable to store total tax value
    let singleIncome = false; // Flag to check if there is only one income source
    const hasTax = userDefinedLinks.some(link => link.type === 'tax'); // Check if there is any tax link
    const parentExpenseMap = new Map<string, number>(); // Map to track parent expenses and their children sum
    const childExpenses = new Set<string>(); // Set to keep track of all child expenses

    // Step 1: Process links and group income, taxes, and expenses
    userDefinedLinks.forEach(link => {
        if (link.type === 'income') {
            incomeNodes.push(link.target); // Collect income nodes
            nodesMap.set(link.target, (nodesMap.get(link.target) || 0) + link.value);
        } else if (link.type === 'tax') {
            nodesMap.set(link.target, (nodesMap.get(link.target) || 0) + link.value);
            totalTaxValue += link.value; // Accumulate total tax value
        } else if (link.type === 'expense') {
            // Check if this expense has a parent (i.e., it's a child expense)
            if (link.source) {
                // Add child expense to the set to identify later
                childExpenses.add(link.target);

                // Add the child expense value to its parent node
                parentExpenseMap.set(link.source, (parentExpenseMap.get(link.source) || 0) + link.value);
            } else {
                // If it's a top-level expense (no source), treat it as a normal expense
                nodesMap.set(link.target, (nodesMap.get(link.target) || 0) + link.value);
            }
        }
    });

    // Step 2: Aggregate income into "Total Income" node if multiple income sources exist
    if (incomeNodes.length > 1) {
        totalIncomeValue = incomeNodes.reduce((sum, node) => sum + (nodesMap.get(node) || 0), 0);
        nodesMap.set('Total Income', totalIncomeValue);
    } else if (incomeNodes.length === 1) {
        singleIncome = true; // Only one income source, no need for a "Total Income" node
        totalIncomeValue = nodesMap.get(incomeNodes[0]) || 0;
    }

    // Step 3: Handle Usable Income if there's a tax link, otherwise use the full income directly
    const incomeSource = singleIncome ? incomeNodes[0] : 'Total Income';

    if (hasTax) {
        const taxLink = userDefinedLinks.find(link => link.type === 'tax');
        let usableIncome = totalIncomeValue;

        if (taxLink) {
            const taxValue = nodesMap.get(taxLink.target) || 0;
            usableIncome -= taxValue; // Subtract taxes
            nodesMap.set('Usable Income', usableIncome); // Set Usable Income node

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

    // Step 5: Calculate the total expenses (only top-level) by summing the top-level expenses and parent group expenses
    let totalExpenseValue = 0;
    userDefinedLinks.forEach(link => {
        if (link.type === 'expense' && !childExpenses.has(link.target)) {
            // Only count top-level expenses and group sums
            const expenseValue = parentExpenseMap.get(link.target) || link.value;
            totalExpenseValue += expenseValue;
        }
    });

    // Step 6: Create links for individual incomes and expenses
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
            // If there's no tax, expenses should directly come from the main income source
            const expenseSource = hasTax ? 'Usable Income' : incomeSource;

            // Check if the user explicitly defined a source for the expense
            if (link.source) {
                links.push({
                    source: link.source, // Use user-defined source
                    target: link.target,
                    value: link.value
                });

                // Ensure that child expenses are added to the nodes
                nodesMap.set(link.target, (nodesMap.get(link.target) || 0) + link.value);
            } else {
                // Link expenses from Usable Income (if taxes exist) or from main income if no taxes
                links.push({
                    source: expenseSource,
                    target: link.target,
                    value: link.value
                });
            }
        }
    });

    // Step 7: Calculate remaining balance
    const remainingBalance = totalIncomeValue - totalExpenseValue - totalTaxValue;

    // Step 8: Convert nodesMap to an array of nodes (including child nodes)
    const nodes: Node[] = Array.from(nodesMap.entries()).map(([name, totalValue]) => ({ name, totalValue }));

    // Step 9: Remove duplicate links
    const uniqueLinks: Link[] = Array.from(new Set(links.map(link => JSON.stringify(link)))).map(link => JSON.parse(link) as Link);

    return { nodes, links: uniqueLinks, remainingBalance };
}

}
