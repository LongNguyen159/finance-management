import { DataService, MonthlyData, ProcessedOutputData } from "../services/data.service";

export function formatDateToString(date: Date): string {
    const year = date.getFullYear(); // Get the full year
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get the month and pad with leading zero
    return `${year}-${month}`; // Return the formatted string
}

export function formatYearMonthToLongDate(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1); // month is zero-indexed
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function parseLocaleStringToNumber(localeString: string): number {
    return parseFloat(localeString.replace(/[^0-9.-]+/g, ''))
}


/** Process data for the requested month.
 * @param selectedMonth The month to process. Type Date.
 * @param allMonthsData The data for all months. Type MonthlyData.
 * @param singleMonthEntries The data for the selected month. Type ProcessedOutputData.
 * @param dataService Function requires dataService to process the input data.
 */
export function onMonthChanges(selectedMonth: Date, allMonthsData: MonthlyData, singleMonthEntries: ProcessedOutputData , dataService: DataService) {    
    if (Object.keys(allMonthsData).length == 0) {
      console.warn('month data is not ready by the time on month changes is called')
      return
    }

    const monthString = formatDateToString(selectedMonth);
    
    // Check if the month exists in the MonthlyData
    if (allMonthsData[monthString]) {
      // Month exists, retrieve the processed data
      const existingData = allMonthsData[monthString];
      singleMonthEntries = existingData; // Update processed output data
      console.log(`month ${monthString} exists, calling service to process input`)
      dataService.processInputData(existingData.rawInput, monthString);
      
    } else {
      // Month does not exist, create a new empty entry
      singleMonthEntries = initializeEmptyData(monthString); // Initialize empty data
      allMonthsData[monthString] = singleMonthEntries; // Add to the monthlyData
      console.log(`No data for ${monthString}. Initialized new entry.`);
      dataService.processInputData([], monthString);
    }
}

function initializeEmptyData(monthString: string): ProcessedOutputData {
    return {
      sankeyData: { nodes: [], links: [] }, // Adjust based on your SankeyData structure
      totalUsableIncome: 0,
      totalGrossIncome: 0,
      totalTax: 0,
      totalExpenses: 0,
      remainingBalance: '0',
      pieData: {},
      rawInput: [],
      month: monthString
    };
}


export function convertYYYMMtoDate(inputString: string): Date {
  const [year, month] = inputString.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date
}