import { Injectable } from '@angular/core';
import { SankeyData, SankeyLink, SankeyNode, UserDefinedLink } from './models';
import { BehaviorSubject } from 'rxjs';



export interface ProcessedOutputData {
    sanekeyData: SankeyData;
    remainingBalance: string;
    pieData: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  userDefinedLinks: UserDefinedLink[] = [
    { type: 'income', target: 'Income', value: 1027 },
    { type: 'income', target: 'Roommate Contribution', value: 565 },
    { type: 'tax', target: 'Taxes', value: 208 },
    { type: 'expense', target: 'Housing', value: 1096 },
    { type: 'expense', target: 'Groceries', value: 160 },
    { type: 'expense', target: 'Commute', value: 49 },
    { type: 'expense', target: 'Electricity', value: 108, source: 'Housing' },
    { type: 'expense', target: 'Water', value: 35, source: 'Housing' },      
    { type: 'expense', target: 'Rent', value: 833, source: 'Housing' },
    { type: 'expense', target: 'Wifi', value: 40, source: 'Housing' },
    { type: 'expense', target: 'Kitchen', value: 80, source: 'Housing' },
    { type: 'expense', target: 'Sport', value: 20 },
    { type: 'expense', target: 'Sim Card', value: 20 },
    { type: 'expense', target: 'Radio Fees', value: 19 },
  ]

  
  sankeyData: SankeyData = {
    nodes: [],
    links: []
  }

  remainingBalance: string = '-';


  processedData: ProcessedOutputData = {
    sanekeyData: this.sankeyData,
    remainingBalance: this.remainingBalance,
    pieData: []
  }

  processedData$ = new BehaviorSubject<ProcessedOutputData>(this.processedData)



  constructor() {
    this.processInputData(this.userDefinedLinks)
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
                nodesMap.get(link.source)!.value += link.value; // Update parent value
                nodesMap.get(link.target)!.value += link.value; // Update child value
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

    /**____________________________________________________________________________________ */
    // Step 4: Calculate total expenses
    let totalExpenseValue = 0;

    // Maps to track sums of child expenses and parent values
    const parentLeafSums = new Map<string, number>(); 
    const parentValues = new Map<string, number>(); 

    // Step 4.1: Calculate sums for leaves and get parent values
    userDefinedLinks.forEach(link => {
        if (link.type === 'expense') {
            const parentNode = link.source;

            // If the link has a source, it's a leaf expense
            if (parentNode) {
                // Accumulate leaf values under their respective parents
                parentLeafSums.set(parentNode, (parentLeafSums.get(parentNode) || 0) + link.value);
            } else {
                // If there's no source, it's a top-level expense (assumed parent)
                parentValues.set(link.target, link.value);
            }
        }
    });

    // Step 4.2: Calculate the effective total expenses in one loop
    parentLeafSums.forEach((leafSum, parentNode) => {
        const parentValue = parentValues.get(parentNode) || 0; // Get the parent's defined value
        totalExpenseValue += Math.max(leafSum, parentValue); // Add the maximum of leafSum or parentValue
    });

    // Step 4.3: Add any remaining individual expenses that are not linked to a parent
    userDefinedLinks.forEach(link => {
        if (link.type === 'expense' && !link.source && !parentLeafSums.has(link.target)) {
            totalExpenseValue += link.value; // Only add expenses that are not accounted for in groups
        }
    });


    const groupedExpenses =  Array.from(parentLeafSums.entries())
    const restExpenses = userDefinedLinks.filter(link => link.type === 'expense' && !link.source && !parentLeafSums.has(link.target)).map(link => [link.target, link.value])
    
    const pieData = [...groupedExpenses, ...restExpenses].map(([name, value]) => ({name, value}))

    

    // Log the final total expense
    console.log('Final Total Expense Value:', totalExpenseValue);

/**____________________________________________________________________________________ */


    // Step 5: Create links for individual incomes and expenses (no need to modify nodesMap again)
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


    // Step 7: Calculate remaining balance
    const remainingBalance = (totalIncomeValue - totalExpenseValue - totalTaxValue).toLocaleString();

    // Step 8: Convert nodesMap to an array of nodes (including child nodes)
    const nodes: SankeyNode[] = Array.from(nodesMap.entries()).map(([name, { value }]) => ({ name, totalValue: value }));
    console.log('nodes', nodes)
    // Step 9: Remove duplicate links
    const uniqueLinks: SankeyLink[] = Array.from(new Set(links.map(link => JSON.stringify(link)))).map(link => JSON.parse(link) as SankeyLink);



    // Update params
    const sankeyData = {
        nodes: nodes,
        links: uniqueLinks
    }


    this.processedData = {
        sanekeyData: sankeyData,
        remainingBalance: remainingBalance,
        pieData: pieData
    }

    this.processedData$.next(this.processedData)


    

    // return { nodes, links: uniqueLinks, remainingBalance, pieData };
    }



    getProcessedData() {
        return this.processedData$.asObservable()
    }
}
