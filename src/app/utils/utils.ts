import { SYSTEM_PREFIX } from "../components/models";
import { DataService, MonthlyData, SingleMonthData } from "../services/data.service";


/** Format a Date object into YYYY-MM format */
export function formatDateToYYYYMM(date: Date): string {
    const year = date.getFullYear(); // Get the full year
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get the month and pad with leading zero
    return `${year}-${month}`; // Return the formatted string
}

/** Format a YYYY-MM string into a long date format like (Oct 2024, Sep 2023) */
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
export function onMonthChanges(selectedMonth: Date, allMonthsData: MonthlyData, singleMonthEntries: SingleMonthData , dataService: DataService) {    
    if (Object.keys(allMonthsData).length == 0) {
      console.warn('month data is not ready by the time on month changes is called')
      return
    }

    const monthString = formatDateToYYYYMM(selectedMonth);

    console.log('processing data for month: ', monthString)
    
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

function initializeEmptyData(monthString: string): SingleMonthData {
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


export function formatYYYMMtoDate(inputString: string): Date {
  const [year, month] = inputString.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date
}


export function sortYearsDescending(years: string[]): string[] {
  return years.sort((a, b) => Number(b) - Number(a));
}

/** Remove system prefixes from name. We use system prefix to avoid
 * name collisions in our data, but we don't want to show it in the UI.
 */
export function removeSystemPrefix(name: string): string {
  return name.replace(new RegExp(`@${SYSTEM_PREFIX}`, 'g'), '');
}