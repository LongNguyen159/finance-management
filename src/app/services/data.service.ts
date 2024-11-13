import { inject, Injectable, signal, EventEmitter } from '@angular/core';
import { EntryType, ExpenseCategory, SankeyData, SankeyLink, SankeyNode, UserDefinedLink } from '../components/models';
import { BehaviorSubject } from 'rxjs';
import { UiService } from './ui.service';
import { formatDateToYYYYMM } from '../utils/utils';
import { ConfirmDialogData } from '../components/dialogs/confirm-dialog/confirm-dialog.component';

/** Interface for multi month data. */
export interface MonthlyData {
    [month: string]: SingleMonthData;
}
/** Interface for single month data. */
export interface SingleMonthData {
    lastUpdated: Date | string
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

interface TreeNode {
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

/** This service main purpose is to handle the processing of Input Data (converting raw input data into Sankey Data with source - target - value).
 * 
 * 
 * This is the central processing part of the app. It also handles saving data into Local Storage and emit observables for the subscribers.
 */
export class DataService {
    private UiService = inject(UiService)

    readonly REMAINING_BALANCE_LABEL = 'Surplus'

    //#region Chart Data
    monthlyData: MonthlyData = {};
    private readonly sankeyDataInit: SankeyData = {
        nodes: [],
        links: []
    }
    private remainingBalance: string = '-';

    /** Emit this object if data has a cycle. Only keep raw input and month for user to correct it.
     * Every other value will be unset to prevent further processing.
     */
    private defaultEmptySingleMonthEntries: SingleMonthData = {
        lastUpdated: '-',
        sankeyData: this.sankeyDataInit,
        totalUsableIncome: -1,
        totalTax: -1,
        totalGrossIncome: -1,
        totalExpenses: -1,
        remainingBalance: this.remainingBalance,
        pieData: [],
        rawInput: [],
        month: ''
    }

    demoLinks: UserDefinedLink[] = [
        { id: 'demo_1' , type: EntryType.Income, target: 'Salary demo', value: 1000, demo: true},
        { id: 'demo_2', type: EntryType.Expense, target: 'Groceries', value: 300, source: ExpenseCategory.Groceries},
        { id: 'demo_3',type: EntryType.Expense, target: 'Pet food', value: 100, source: ExpenseCategory.Groceries},
    ]

    
    /** Behaviour subjects to emit the values. */
    private processedSingleMonthEntries$ = new BehaviorSubject<SingleMonthData>(this.defaultEmptySingleMonthEntries)
    private multiMonthEntries$ = new BehaviorSubject<MonthlyData>(this.monthlyData)
    private dataSaved$ = new BehaviorSubject<boolean>(false)
    //#endregion



    
    //#region States
    /** Signal to check if the app is in demo mode. */
    isDemo = signal(false)

    /** Flag to show/hide advanced options in the form. This being here for state saving only.
     * Meaning components can modify this value. Turning into Signal might also be a good idea.
     */
    isAdvancedShown: boolean = true

    /** Use this to scale all income-expense bar chart to have same scale.
     * This value will be the largest value of either totalUsableIncome or totalExpenses.
     */
    incomeExpenseScaleValue = signal(0)


    /** Data cycle flag. If true, means contains data cycle in the sankey.
     * If this is the case, do not process the data.
     */
    hasDataCycle = signal(false)

    private navigateToFixCost = new EventEmitter<boolean>(false)

    selectedActiveDate: Date = new Date();
    //#endregion

    /** Immutable states */
    private readonly copiedLinksKey = 'copiedLinks';
    readonly nonAllowedNames = ['Total Income', 'Usable Income', 'Total Expenses', 'Total Tax', this.REMAINING_BALANCE_LABEL, '-- None --' , ...Object.values(ExpenseCategory)];


    constructor() {
        this.initializeData()
    }

    //#region: Initialise Data
    private initializeData(): void {
        this.removeOldUserFinancialData(); // Remove old key from previous versions
    
        // Check if it's the user's first time
        if (this.isFirstTimeUser() || this.isOldVersion()) {
            console.log('First time user or outdated app version. Processing demo data.');
            this.processDemoData();
        } else {
            // Load existing data or prepare for user input
            this.loadExistingData();
        }
    }
    
    isFirstTimeUser(): boolean {
        const firstTime = localStorage.getItem('firstTime');
        return firstTime == null || firstTime === 'true' || firstTime == undefined;
    }

    isOldVersion(): boolean {
        const storedVersion = localStorage.getItem('appVersion');
        if (!storedVersion) return true; // Treat as outdated if version is missing
    
        const [major, minor] = storedVersion.split('.').map(Number);
        return major < 2 || (major === 2 && minor < 0);
    }
    
    private processDemoData(): void {
        const todaysDate = new Date();
        this.processInputData(this.demoLinks, formatDateToYYYYMM(todaysDate), { demo: true, emitObservable: true});
    }
    
    private loadExistingData(): void {
        const savedData = this.loadData();
        if (savedData && Object.keys(savedData).length > 0) {
            console.log('Saved data found:', savedData);
            this.monthlyData = savedData;  // Load saved data
            // this.processedSingleMonthEntries$.next(this.monthlyData['2024-09']);  // Emit saved data
            this.multiMonthEntries$.next(this.monthlyData);  // Emit all months data
        } else {
            console.log('No saved data found.');
            this.processInputData([], formatDateToYYYYMM(new Date()));
        }
    }
    //#endregion


    
    /** TODO refactor this to utils file.
     * This function is used by charts to get the current date in the format "YYYY-MM-DD".
     * The date will be shown when user exports the chart as image.
     */
    getTodaysDate() {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    }
    

    //#region: Process Input Data

    /**
     * Processes input data and emits a Subject for single month entries.
     * @param userDefinedLinks - The raw input data from the form.
     * @param month - The month for which to process data, in "YYYY-MM" format.
     * @param options - An object containing optional configuration flags:
     *   - demo: `boolean` (default: `false`) - Indicates if the data is demo data.
     *   - showSnackbarWhenDone: `boolean` (default: `false`) - Shows a snackbar notification when data processing is complete.
     *   - emitObservable: `boolean` (default: `true`) - If `true`, emits an observable with the processed data for further actions.
     *       If `false`, only saves the processed data in local storage without emitting.
     */
    processInputData(userDefinedLinks: UserDefinedLink[], month: string, options: { demo?: boolean, showSnackbarWhenDone?: boolean, emitObservable?: boolean } = { demo: false, showSnackbarWhenDone: false, emitObservable: true }): void {
        /** Prevent overriding default value if not given.
         * e.g. `emitObservable` defaults to true, but if not provided by caller, it will be undefined.
         * This line below will set it to true if it's not provided.
         */
        const { demo = false, showSnackbarWhenDone = false, emitObservable = true } = options;



        /** Early exit if detect negative values. */
        const negatives = userDefinedLinks.filter(link => link.value < 0);
        if (negatives.length > 0) {
            this.UiService.showSnackBar('Negative values are not allowed', 'Dismiss', 5000);
            return;
        }
        
        /** Check for non valid values field. */
        if ((userDefinedLinks && userDefinedLinks.length > 0) && userDefinedLinks.some(link => typeof link.value !== 'number' || isNaN(link.value))) {
            console.error('Error: One or more values are not valid numbers');
            this.UiService.showSnackBar('One or more values are not valid numbers', 'Dismiss', 5000);
            return;
        }
        
        if (this.checkDuplicateNames(userDefinedLinks)) {
            this.UiService.showSnackBar('Duplicate names are not allowed', 'Dismiss', 5000);
            return;
        }

        /** Check for restricted name usage */
        if (userDefinedLinks.some(link => this.nonAllowedNames.includes(link.target))) {
            const foundLinks = userDefinedLinks.filter(link => this.nonAllowedNames.includes(link.target));
            const dialogData: ConfirmDialogData = {
                title: 'Warning: Restricted Name Usage',
                message: `Some names in your input are reserved for internal use and may cause unexpected behaviours. 
                          Please rename the following entries:<br><br>
                          ${foundLinks.map(link => `- "${link.target}"`).join('<br>')}
                         `,
                confirmLabel: 'OK'
            };
            this.UiService.openConfirmDialog(dialogData)
        }

        /** Early exit if detect data cycle */
        if (this.hasDataCycle()) {
            this.UiService.showSnackBar('Data has a cycle! Check your input.', 'Dismiss', 5000);
            console.log('Data has a cycle! Emitting default entries');
            this.defaultEmptySingleMonthEntries = {
                lastUpdated: '-',
                sankeyData: this.sankeyDataInit,
                totalUsableIncome: -1,
                totalTax: -1,
                totalGrossIncome: -1,
                totalExpenses: -1,
                remainingBalance: '-',
                pieData: [],
                rawInput: userDefinedLinks,
                month: month
            }
            this.processedSingleMonthEntries$.next(this.defaultEmptySingleMonthEntries);
            return;
        }


        const nodesMap = new Map<string, { value: number, type: EntryType }>(); // Map to hold unique nodes and their total values and types
        const links: SankeyLink[] = []; // Array to hold links between nodes
        const incomeNodes: string[] = []; // Track income nodes
        let totalIncomeValue = 0; // Variable to store total income value
        let totalTaxValue = 0; // Variable to store total tax value
        let singleIncome = false; // Flag to check if there is only one income source
        const hasTax = userDefinedLinks.some(link => link.type === EntryType.Tax); // Check if there is any tax link

        /** Demo flag: Only set to true when the app loads for the first time
         * to show our demo graph for first time users.
         */
        if (demo || JSON.stringify(userDefinedLinks) == JSON.stringify(this.demoLinks) || userDefinedLinks.some(link => link.demo)) {
            this.isDemo.set(true)
        } else {
            this.isDemo.set(false)
        }


        // Step 1: Initialize the nodes without adding values yet
        userDefinedLinks.forEach(link => {
            if (!nodesMap.has(link.target)) {
                nodesMap.set(link.target, { value: 0, type: link.type });
            }

            // Step 1.2: Process links to accumulate income, taxes, and expenses
            if (link.type == EntryType.Income) {
                incomeNodes.push(link.target);
                nodesMap.get(link.target)!.value += link.value; // Add income only once
            } else if (link.type === EntryType.Tax) {
                nodesMap.get(link.target)!.value += link.value;
                totalTaxValue += link.value;
            } else if (link.type === EntryType.Expense) {
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
            // Sum up every item in incomeNodes to get total income value
            totalIncomeValue = incomeNodes.reduce((sum, node) => sum + (nodesMap.get(node)?.value || 0), 0);
            nodesMap.set('Total Income', { value: totalIncomeValue, type: EntryType.Income });

        } else if (incomeNodes.length === 1) {
            singleIncome = true; // Only one income source, no need for a "Total Income" node


            // Total income value will be the value of incomeNodes[0], because there's only one anyway.
            totalIncomeValue = nodesMap.get(incomeNodes[0])?.value || 0;
        }

        // Step 3: Handle Usable Income if there's a tax link, otherwise use the full income directly
        const incomeSource = singleIncome ? incomeNodes[0] : 'Total Income';
        const taxLink = userDefinedLinks.find(link => link.type == EntryType.Tax);



        /** If has tax, create 'Usable Income' node and use it as source for all expenses. */
        if (hasTax && taxLink) {
            let usableIncome = totalIncomeValue;
            const taxValue = nodesMap.get(taxLink.target)?.value || 0;
            usableIncome -= taxValue; // Subtract taxes
            nodesMap.set('Usable Income', { value: usableIncome, type: EntryType.Income }); // Set Usable Income node

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
        
        /** This will be the default root node for Sankey Chart. The source for all expenses to flow from. */
        const sourceForExpenses = hasTax ? 'Usable Income' : incomeSource;

        // Step 4: Create links for expenses, using default expense source.
        const allowedCategories = Object.values(ExpenseCategory);

        userDefinedLinks.forEach(link => {
            if (link.type == EntryType.Income) {
                if (!singleIncome) {
                    links.push({
                        source: link.target,
                        target: 'Total Income',
                        value: link.value
                    });
                }
            } else if (link.type === EntryType.Expense) {
                let sourceNode = link.source || sourceForExpenses;

                // Check if the source node exists in nodesMap or is an allowed category
                if (!nodesMap.has(sourceNode) && allowedCategories.includes(sourceNode as ExpenseCategory)) {
                    // Create the missing source node as a new entry with 'Expense' type
                    nodesMap.set(sourceNode, { value: 0, type: EntryType.Expense });

                    // Calculate its total value by summing all links that use it as a source
                    const sourceValue = userDefinedLinks
                        .filter(childLink => childLink.source === sourceNode)
                        .reduce((sum, childLink) => sum + childLink.value, 0);
                    
                    // Set the source node's accumulated value
                    nodesMap.get(sourceNode)!.value = sourceValue;

                    // Add a link from the new source node to its child
                    links.push({
                        source: sourceNode,
                        target: link.target,
                        value: link.value
                    });

                    // Link newly created source node to the default income node
                    links.push({
                        source: sourceForExpenses, // Link to default income (Total Income or single income node)
                        target: sourceNode,
                        value: sourceValue
                    });
                } else {
                    // If the source is not found or is not in allowed categories, link directly to default income
                    const validSource = nodesMap.has(sourceNode) ? sourceNode : sourceForExpenses;
                    
                    links.push({
                        source: validSource,
                        target: link.target,
                        value: link.value
                    });
                }
            }
        });

        //#endregion


        //#region: Handle Return params

        // Step 5: Get Links and Nodes

        // Convert nodesMap to an array of nodes (including child nodes)
        const nodes: SankeyNode[] = Array.from(nodesMap.entries()).map(([name, { value }]) => ({ name, value: value }));

        // Remove duplicate links
        const uniqueLinks: SankeyLink[] = Array.from(new Set(links.map(link => JSON.stringify(link)))).map(link => JSON.parse(link) as SankeyLink);
 

       // Step 6: Calculate return params

       /** Pie data will be generated based on Tree Structure generated from Sankey.
        * Not from Sankey links.
        * 
        * Pie data will be the top level expenses only, meaning the first level in tree structure.
        * We do this because how else would we know which items are top level or which are children of which?
        * So we transform Sankey data (source - target - value) into a tree structure (name - value - children).
        * 
        * => If you want to modify pie chart data, modify tree structure.
        */
       let pieSeriesData: {name: string, value: number}[] = []

        const { totalExpenses, topLevelexpenses: pieData, changedExpensesDuringCalculation: changedExpensesDuringCalculation } = this._getExpensesData(uniqueLinks, hasTax, incomeNodes.length);
        const remainingBalance: number = (totalIncomeValue - totalExpenses - totalTaxValue)

        // Push remaining balance number to Pie Data to show how much is left proportionally.
        pieSeriesData = [
            ...pieData,
            { name: this.REMAINING_BALANCE_LABEL, value: remainingBalance },
        ];


        let updatedRawInput: UserDefinedLink[] = userDefinedLinks; // Default to original input

        /** Update raw input if there are changes in expenses during calculation.
         * The value of some parent will be added up to correctly reflect total value of children.
         * Raw Input should be updated to correctly populate the form with new values.
         */
        if (changedExpensesDuringCalculation.length > 0) {
            updatedRawInput = this._updateUserInput(userDefinedLinks, changedExpensesDuringCalculation);
        }

        // Update Sankey nodes and links based on updatedRawInput
        const updatedNodes = nodes.map(node => {
            const updatedNode = updatedRawInput.find(link => link.target === node.name);
            return updatedNode ? { ...node, value: updatedNode.value } : node; // Update value or leave as is
        });

        const updatedLinks = links.map(link => {
            const updatedLink = updatedRawInput.find(l => l.target === link.target);
            return updatedLink ? { ...link, value: updatedLink.value } : link; // Update value or leave as is
        });

        const savedSingleMonthData = this.loadSingleMonth(month);
        console.log('Saved Single Month Data:', savedSingleMonthData);
        console.log('Processing input data:', userDefinedLinks);
        console.log('Is different from saved data:', JSON.stringify(userDefinedLinks) !== JSON.stringify(savedSingleMonthData?.rawInput));
        const isDifferent: boolean = JSON.stringify(userDefinedLinks) !== JSON.stringify(savedSingleMonthData?.rawInput);
        const isEmpty: boolean = userDefinedLinks.length === 0;
        console.log('is empty:', isEmpty);



        // Final Object to be emitted
        this.monthlyData[month] = {
            lastUpdated: (isDifferent && !isEmpty) ? new Date() : savedSingleMonthData?.lastUpdated || '-',
            sankeyData: { nodes: updatedNodes, links: updatedLinks },
            totalUsableIncome: totalIncomeValue - totalTaxValue,
            totalGrossIncome: totalIncomeValue,
            totalTax: totalTaxValue,
            totalExpenses: totalExpenses,
            remainingBalance: remainingBalance.toLocaleString('en-US'),
            pieData: pieSeriesData,
            rawInput: updatedRawInput,
            month: month
        };

        // Emit the processed data
        if (emitObservable) {
            this.processedSingleMonthEntries$.next(this.monthlyData[month]) // emit single month data
            console.log('Observable emitted:', this.monthlyData[month]);
            // this.multiMonthEntries$.next(this.monthlyData) // emit multi month data
        }

        if (showSnackbarWhenDone && !this.isDemo()) {
            this.UiService.showSnackBar('Data processed successfully!', 'OK', 3000);
        }

        
        if (isDifferent) {
            this.saveData()
        }
        //#endregion
    }

    checkDuplicateNames(links: UserDefinedLink[]): boolean {
        const values: string[] = links.map(link => link.target);
        // Track duplicates
        const seen = new Set<string>();
        const duplicateNames = values.filter((item) => {
        const normalizedItem = item.toLowerCase().trim();
        if (seen.has(normalizedItem)) {
            return true;
        }
        seen.add(normalizedItem);
        return false;
        });

        if (duplicateNames.length > 0) {
        return true
        } else {
        return false
        }
    }

    /** Update Raw input to correctly reflect the parent value as sum of their children values.
     * @param oldInput - The original input data.
     * @param changedExpenses - The array of changed expenses during calculation.
     * 
     * @returns The updated input data with parent values updated to reflect the sum of their children.
     */
    private _updateUserInput(oldInput: UserDefinedLink[], changedExpenses: TreeNode[]): UserDefinedLink[] {
        return oldInput.map(link => {
            // Check if the current link's target matches any of the changed expenses
            const updatedExpense = changedExpenses.find(node => node.name === link.target);
            // If it matches, return a new link object with the updated value; otherwise, return the original link
            return updatedExpense ? { ...link, value: updatedExpense.value } : link;
        });
    }

    //#endregion


    //#region Local Storage
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
    
        /** Save all months data in Local Storage.
         * Optimise:
         * Only write into Local Storage the processed data?
         * Currently we are writing all months in on every save.
         * 
         */
        localStorage.setItem('monthlyData', JSON.stringify(nonEmptyMonthlyData));
        console.log('Data saved:', nonEmptyMonthlyData);

        // Emit all months data
        this.multiMonthEntries$.next(nonEmptyMonthlyData);
        this.dataSaved$.next(true);
    }

    /** Retrieve existing entries from Local Storage */
    loadData(): MonthlyData | null {
        const saved = localStorage.getItem('monthlyData');
        return saved ? JSON.parse(saved) as MonthlyData: null;
    }

    loadSingleMonth(month: string): SingleMonthData | null {
        const saved = localStorage.getItem('monthlyData');
        if (saved) {
            const data = JSON.parse(saved) as MonthlyData;
            return data[month] || null;
        }
        return null;
    }

    /** Return all local storage items
     * 
     * UNUSED: This function is not used in the current implementation. But reserved for future use.
     */
    getAllLocalStorageItems(): { [key: string]: any } {
        const items: { [key: string]: any } = {};
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)!;
          const value = localStorage.getItem(key)!;
          
          try {
            // Attempt to parse the value if it's in JSON format
            items[key] = JSON.parse(value);
          } catch (e) {
            // If parsing fails, treat it as a string
            items[key] = value;
          }
        }
        
        return items;
    }

    /** Get monthly data object from Local Storage.
     * @returns All months data. Key as yyyy-mm format, value are corresponding entries.
     */
    getMonthlyDataFromLocalStorage(): { [key: string]: any } {
        const monthlyData = localStorage.getItem('monthlyData');
        if (!monthlyData) {
            return {}
        }
        try {
            return JSON.parse(monthlyData);
        } catch (e) {
            console.error('Failed to parse monthlyData', e);
            return {};
        }
    }

    setMonthlyData(monthlyData: { [key: string]: any }): void {
        localStorage.setItem('monthlyData', JSON.stringify(monthlyData));
    }


    /** Remove a specific month entries from Local Storage. Used by Finance Manager,
     * to delete all entries of a month.
     */
    removeMonthFromLocalStorage(key: string) {
        // Get the current data from LocalStorage
        const storedData = localStorage.getItem('monthlyData');
    
        if (storedData) {
            // Parse the JSON data into an object
            const data = JSON.parse(storedData);
    
            // Check if the key exists in the data
            if (data[key]) {
                // Delete the entry for the specified key
                delete data[key];
    
                // Update LocalStorage with the modified data
                localStorage.setItem('monthlyData', JSON.stringify(data));
                this.processInputData([], key); // Process empty data to update the UI
            }
        }
    }


    /** Migrating logic: Remove old entry from older version of the app. */
    removeOldUserFinancialData(): void {
        localStorage.removeItem('userFinancialData');
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
    //#endregion


    //#region Copy & Paste Links
    // Store in sessionStorage
    storeCopiedLinks(links: UserDefinedLink[]) {
        sessionStorage.setItem(this.copiedLinksKey, JSON.stringify(links));
    }

    // Retrieve from sessionStorage
    retrieveCopiedLinks(): UserDefinedLink[] | null {
        const data = sessionStorage.getItem(this.copiedLinksKey);
        return data ? JSON.parse(data) : null;
    }


    retrieveFixCostsLinks(): UserDefinedLink[] {
        const fixedLinks = localStorage.getItem('fixCosts')
        return fixedLinks ? JSON.parse(fixedLinks) : []  
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

        /** Tree might be modified during calculations. So if you want to use the tree structure, write code after these lines. */
        const totalExpenses: number = this._calculateNodeExpense(treeFromRootNode, true);
        const changedNodes: TreeNode[] = this._getChangedNodes(treeFromRootNode);
        
        /** Tree is in recursive structure, but we only care about Top-level expense for pie data.
         * So only iterate through children of root node to get top level expenses.
         */
        const pieData = treeFromRootNode.children.map(child => {
            return {
                name: child.name,
                value: child.value
            }
        })

        return {
            totalExpenses: totalExpenses,
            topLevelexpenses: pieData,
            changedExpensesDuringCalculation: changedNodes
        }
    }

    /** Recursively transverse the tree to find the modified nodes.
     * @param node - The current node to check for changes. Or the starting node.
     * It will recursively check all children of the node.
     * @param changedNodes - The array to store the changed nodes. Default to empty array, will be used in recursion to push in changed nodes.
     * 
     * @returns An array of changed nodes.
     */
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
    

    setNavigateFixCostState(value: boolean) {
        this.navigateToFixCost.emit(value)
    }

    getNavigateFixCostState() {
        return this.navigateToFixCost.asObservable()
    }

    //#region: Getters
    /** Get single month entries */
    getSingleMonthData() {
        return this.processedSingleMonthEntries$.asObservable()
    }


    /** Get all months entries. Key as yyyy-mm format, value are corresponding entries. */
    getAllMonthsData() {
        return this.multiMonthEntries$.asObservable()
    }

    isDataSaved() {
        return this.dataSaved$.asObservable()
    }

    //#endregion
}
