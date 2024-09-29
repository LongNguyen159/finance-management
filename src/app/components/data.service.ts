import { Injectable } from '@angular/core';
import { SankeyLink, UserDefinedLink } from './models';


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
    { type: 'income', target: 'Main Salary', value: 3000 },
    { type: 'income', target: 'Freelance Job', value: 1200 },
    { type: 'tax', target: 'Taxes', value: 500 },
    { type: 'expense', target: 'Housing', value: 1200 },
    { type: 'expense', target: 'Groceries', value: 400 },
    { type: 'expense', target: 'Commute', value: 150 },
    { type: 'expense', target: 'Electricity', value: 100, source: 'Housing' }, // Specified source
    { type: 'expense', target: 'Water', value: 30, source: 'Housing' },       // Specified source
    { type: 'expense', target: 'Wifi', value: 40, source: 'Housing' }         // Specified source
  ];

  


  
  constructor() {


    const { nodes, links } = this.processInputData(this.userDefinedLinks);

    // Output the result
    console.log('Nodes:', nodes);
    console.log('Links:', links);
  }


  processInputData(userDefinedLinks: UserDefinedLink[]): { nodes: Node[], links: Link[] } {
    const nodesMap = new Map<string, number>(); // Map to hold unique nodes and their total values
    const links: Link[] = []; // Array to hold links between nodes
    const incomeNodes: string[] = []; // Track income nodes
    let totalIncomeNodeCreated = false; // Flag to check if total income node is created
    let totalIncomeValue = 0; // Variable to store total income value

    // Process links and group income, expenses, and tax
    userDefinedLinks.forEach(link => {
        if (link.type === 'income') {
            incomeNodes.push(link.target); // Collect income nodes
            nodesMap.set(link.target, (nodesMap.get(link.target) || 0) + link.value);
        } else if (link.type === 'tax') {
            nodesMap.set(link.target, (nodesMap.get(link.target) || 0) + link.value);
        } else if (link.type === 'expense') {
            // Create the node for the expense target
            nodesMap.set(link.target, (nodesMap.get(link.target) || 0) + link.value);
        }
    });

    // Create Total Income node if there are multiple income nodes
    if (incomeNodes.length > 1) {
        totalIncomeValue = incomeNodes.reduce((sum, node) => sum + (nodesMap.get(node) || 0), 0);
        nodesMap.set('Total Income', totalIncomeValue);
        totalIncomeNodeCreated = true; // Mark that the Total Income node has been created
    } else if (incomeNodes.length === 1) {
        totalIncomeValue = nodesMap.get(incomeNodes[0]) || 0; // Only one income source
    }

    // Calculate Usable Income
    const taxNode = userDefinedLinks.find(link => link.type === 'tax');
    let usableIncome = totalIncomeValue; // Default to total income if no taxes

    if (taxNode) {
        const taxValue = nodesMap.get(taxNode.target) || 0;
        usableIncome = totalIncomeValue - taxValue; // Calculate usable income by deducting tax
    }
    nodesMap.set('Usable Income', usableIncome); // Store usable income in nodes map

    // Create links based on income, taxes, and expenses
    userDefinedLinks.forEach(link => {
        let sourceNode: string;

        if (link.type === 'income') {
            // Check if there is only one income node
            if (incomeNodes.length === 1) {
                sourceNode = link.target; // If only one income, link directly
            } else {
                sourceNode = 'Total Income'; // If multiple incomes, link to total income
            }
            // Create link for income
            links.push({
                source: link.target,
                target: sourceNode,
                value: link.value
            });
        } else if (link.type === 'tax') {
            // Create link from total income or specific income source
            if (incomeNodes.length > 1) {
                links.push({
                    source: 'Total Income',
                    target: link.target,
                    value: link.value
                });
            } else {
                links.push({
                    source: incomeNodes[0], // Source is the only income node
                    target: link.target,
                    value: link.value
                });
            }
        } else if (link.type === 'expense') {
            // Link expenses from Usable Income by default
            links.push({
                source: 'Usable Income',
                target: link.target,
                value: link.value
            });
        }
    });

    // Create a link from Total Income to Usable Income
    if (totalIncomeNodeCreated) {
        links.push({
            source: 'Total Income',
            target: 'Usable Income',
            value: usableIncome
        });
    }

    // Convert nodesMap to an array of nodes
    const nodes: Node[] = Array.from(nodesMap.entries()).map(([name, totalValue]) => ({ name, totalValue }));

    // Remove duplicate links
    const uniqueLinks: Link[] = Array.from(new Set(links.map(link => JSON.stringify(link)))).map(link => JSON.parse(link) as Link);

    return { nodes, links: uniqueLinks };
}
  
}
