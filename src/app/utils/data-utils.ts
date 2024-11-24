import { DataService } from "../services/data.service";
import { MonthlyData, SingleMonthData } from "../components/models";
import { formatDateToYYYYMM } from "./utils";

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
    // Check if the month exists in the MonthlyData
    if (allMonthsData[monthString]) {
      // Month exists, retrieve the processed data
      const existingData = allMonthsData[monthString];
      singleMonthEntries = existingData; // Update processed output data
      dataService.processInputData(existingData.rawInput, monthString);
      
    } else {
      // Month does not exist, create a new empty entry
      singleMonthEntries = initializeEmptyData(monthString); // Initialize empty data
      allMonthsData[monthString] = singleMonthEntries; // Add to the monthlyData
      dataService.processInputData([], monthString);
    }
}

function initializeEmptyData(monthString: string): SingleMonthData {
    return {
      lastUpdated: '-',
      sankeyData: { nodes: [], links: [] }, // Adjust based on your SankeyData structure
      totalUsableIncome: 0,
      totalGrossIncome: 0,
      totalTax: 0,
      totalExpenses: 0,
      remainingBalance: '0',
      pieData: [],
      rawInput: [],
      month: monthString,
      treeMapData: []
    };
}