import { Abnormality, AbnormalityAnalysis, AbnormalityType, DifferenceItem, PieData, SYSTEM_PREFIX, TrendsLineChartData } from "../components/models";
import { evaluate } from 'mathjs/number';

//#region Date utils
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


export function formatYYYYMMtoDate(inputString: string): Date {
  const [year, month] = inputString.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date
}


export function sortYearsDescending(years: string[]): string[] {
  return years.sort((a, b) => Number(b) - Number(a));
}

/** Get last month value from a YYYY-MM string.
 * @param monthStr The input month in YYYY-MM format
 * 
 * @returns The last month in YYYY-MM format
 */
export function getLastMonth(monthStr: string | undefined): string | undefined {
  // Early exit if the input is empty or undefined
  if (!monthStr) {
    return undefined;
  }

  // Split the input into year and month
  let [year, month] = monthStr.split('-').map(Number);

  // Ensure valid year and month
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return undefined;
  }

  // Subtract one month
  month -= 1;

  // If month becomes 0 (January), move to December of the previous year
  if (month === 0) {
    month = 12;
    year -= 1;
  }

  // Format the result back into YYYY-MM
  return `${year}-${month.toString().padStart(2, '0')}`;
}



//#endregion


//#region String Format
/** Remove system prefixes from name. We use system prefix to avoid
 * name collisions in our data, but we don't want to show it in the UI.
 */
export function removeSystemPrefix(name: string): string {
  return name.replace(new RegExp(`@${SYSTEM_PREFIX}`, 'g'), '');
}

//#endregion


//#region Number Format

export function parseLocaleStringToNumber(localeString: string): number {
  return parseFloat(localeString.replace(/[^0-9.-]+/g, ''))
}


/** Process string input like '110 + 50' to '160'
* @param amount The string input to process
* @returns The total amount as a number or null if the input is invalid
*/
export function processStringAmountToNumber(amount: string | number): number | null {
  if (typeof amount === 'number') {
    return amount; // If the amount is already a number, return it directly
  }
  
  const implicitAddition = addImplicitPlusSigns(amount);


  // Validate the cleaned input: must consist of valid numbers with optional "+" and "-" signs
  if (!/^[-+]?(\d+(\.\d+)?)([-+]\d+(\.\d+)?)*$/.test(implicitAddition.replace(/\s/g, ''))) {
    return null; // Invalid input
  }

  try {
    // Use mathjs's evaluate function to compute the total
    const total = evaluate(implicitAddition);
    return typeof total === 'number' ? Math.round(total * 100 ) / 100 : null;
  } catch (error) {
    return null; // In case of any error during evaluation
  }
}

export function addImplicitPlusSigns(amount: string): string {
  // Replace commas with dots for German input
  const normalizedAmount =  amount.replace(/,/g, '.');

  // Remove unnecessary spaces around numbers, "+" and "-" signs
  const cleanedAmount = normalizedAmount.replace(/\s+/g, ' ');

  // Convert isolated spaces between numbers into '+' for implicit addition
  const implicitAddition = cleanedAmount.replace(/(\d)\s+(?=\d)/g, '$1+');
  return implicitAddition;
}

/**
 * Format a number with suffixes for thousands, millions, and billions.
 * @param num The number to format
 * @param currencySymbol The currency symbol to prepend to the formatted number. If don't want to prepend any currency symbol, pass an empty string.
 * 
 * @param minValue The minimum value to format. If the number is less than this value, it will be formatted as a regular number.
 * for K formatter, it's recommended to use 1000 as the minValue.
 * @returns The formatted string
 */
export function formatBigNumber(num: number, currencySymbol: string = '', minValue: number = 10_000): string {
  const sign = num < 0 ? '-' : '';
  const absNum = Math.abs(num);

  let formattedNumber: string;
  if (absNum >= 1_000_000_000) {
    formattedNumber = (absNum / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (absNum >= 1_000_000) {
    formattedNumber = (absNum / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (absNum >= minValue) {
    formattedNumber = (absNum / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    formattedNumber = absNum.toLocaleString('en-US');
  }

  return `${sign}${currencySymbol}${formattedNumber}`;
}
//#endregion


/** Function to compute differences (in percentage) between two months Pie Data (Top Level expenses, often include categories spending).
 * @param currentMonth The Pie Data for the current month
 * @param lastMonth The Pie Data for the last month
 * 
 * @returns An array of DifferenceItem objects.
 */
export function calculateDifferences(currentMonth: PieData[], lastMonth: PieData[]): DifferenceItem[] {
  const lastMonthMap = new Map(lastMonth.map(item => [item.name, item.value]));
  const differences: DifferenceItem[] = [];

  // Process current month data
  for (const currentItem of currentMonth) {
    const lastValue = lastMonthMap.get(currentItem.name);

    if (lastValue !== undefined) {
      // Calculate percentage difference
      const percentageChange = ((currentItem.value - lastValue) / Math.abs(lastValue)) * 100;
      const roundedChange = Math.round(percentageChange * 100) / 100;
      const isSurplus = currentItem.name === "Surplus";

      
      differences.push({
        name: currentItem.name,
        lastValue: lastValue,
        currentValue: currentItem.value,
        difference:
          roundedChange === 0
            ? "Stable"
            : roundedChange > 0
            ? `+${roundedChange}%`
            : `${roundedChange}%`, // Add "+" sign for positive changes
        isPositive: roundedChange === 0 
          ? undefined // Neutral for stable
          : isSurplus 
          ? roundedChange > 0 // Surplus is positive if it increases
          : roundedChange < 0, // For other items, negative change is good
      });


      // Remove processed item from last month map
      lastMonthMap.delete(currentItem.name);
    } else {
      // New item
      differences.push({
        name: currentItem.name,
        difference: "New",
        isNew: true,
        isPositive: false, // Neutral for new items
      });
    }
  }

  // Process remaining items in last month map
  // for (const [name] of lastMonthMap.entries()) {
  //   differences.push({
  //     name,
  //     difference: "No spending",
  //     isPositive: true, // Good for no spending on current month
  //   });
  // }

  return differences;
}

/** Detect Anomalies in Spending of each Categories. */
/** Detect Anomalies in Spending of each Category. */
export function detectAbnormalities(
  data: TrendsLineChartData[],
  currencySymbol: string = ''
): AbnormalityAnalysis[] {
  const categoryMap = aggregateCategoryData(data);

  // Analyze each category
  const analysis: AbnormalityAnalysis[] = Array.from(categoryMap.entries()).map(([name, { values, months }]) => {
    const nonZeroValues = values.filter(value => value > 0);
    const median = calculateMedian(nonZeroValues);
    const stdDev = calculateStdDev(nonZeroValues, median);

    const abnormalities: Abnormality[] = [];
    const fluctuation = calculateFluctuation(nonZeroValues, median, stdDev);

    console.log('category', name)
    const growthDetected = isUpwardTrend(values);
    console.log('growthDetected', growthDetected)
    console.log('fluctuation', fluctuation)
    console.log('-----------------')
    
    if (growthDetected && fluctuation < 0.5) {
      abnormalities.push({
        type: AbnormalityType.ConsistentGrowth,
        description: `Spending shows consistent growth over time.`,
      });
    }

    if (growthDetected && fluctuation >= 0.5) {
      abnormalities.push({
        type: AbnormalityType.FluctuatingGrowth,
        description: `Spending grows overall but with significant fluctuations.`,
      });
    }


    detectSingleOccurrence(values, months, abnormalities, currencySymbol);
    detectSpikes(values, months, abnormalities, median, stdDev, currencySymbol);
    detectFluctuations(values, months, abnormalities, fluctuation, median, stdDev, currencySymbol);

    const cleanedName = removeSystemPrefix(name);
    return { name: cleanedName, abnormalities, categoryName: name };
  });

  return analysis.filter(category => category.abnormalities.length > 0);
}

/** Step 1: Aggregate data by category. */
function aggregateCategoryData(data: TrendsLineChartData[]): Map<string, { values: number[]; months: string[] }> {
  const categoryMap = new Map<string, { values: number[]; months: string[] }>();

  data.forEach(monthData => {
    monthData.categories.forEach(category => {
      if (!categoryMap.has(category.name)) {
        categoryMap.set(category.name, { values: [], months: [] });
      }
      const categoryEntry = categoryMap.get(category.name)!;
      categoryEntry.values.push(category.value);
      categoryEntry.months.push(monthData.month);
    });
  });

  return categoryMap;
}

/** Step 2: Calculate standard deviation. */
function calculateStdDev(values: number[], median: number): number {
  const variance = values.reduce((sum, val) => sum + Math.pow(val - median, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/** Step 3: Calculate fluctuation as a coefficient of variation. */
function calculateFluctuation(values: number[], median: number, stdDev: number): number {
  return stdDev / median;
}

/** Step 4: Detect single occurrences. */
function detectSingleOccurrence(values: number[], months: string[], abnormalities: Abnormality[], currencySymbol: string): void {
  if (values.filter(value => value > 0).length === 1) {
    const singleIndex = values.findIndex(value => value > 0);
    abnormalities.push({
      type: AbnormalityType.SingleOccurrence,
      description: `One-time expense recorded in ${months[singleIndex]}: ${currencySymbol}${values[singleIndex].toLocaleString('en-US')}.`,
      month: months[singleIndex],
      value: values[singleIndex],
    });
  }
}

/** Step 5: Detect spikes. */
function detectSpikes(
  values: number[],
  months: string[],
  abnormalities: Abnormality[],
  median: number,
  stdDev: number,
  currencySymbol: string
): void {
  values.forEach((value, index) => {
    if (value > median + 1.5 * stdDev) {
      abnormalities.push({
        type: AbnormalityType.Spike,
        description: `Spending spike in ${months[index]}: ${currencySymbol}${value.toLocaleString('en-US')}.`,
        month: months[index],
        value: value,
      });
    }
  });
}

/** Step 6: Detect fluctuations. */
function detectFluctuations(
  values: number[],
  months: string[],
  abnormalities: Abnormality[],
  fluctuation: number,
  median: number,
  stdDev: number,
  currencySymbol: string
): void {
  if (fluctuation >= 0.5 && fluctuation < 1) {
    const highMonths = values
      .map((value, index) => value > median + stdDev ? `${months[index]} (${currencySymbol}${value.toLocaleString('en-US')})` : null)
      .filter(Boolean) as string[];

    if (highMonths.length > 0) {
      abnormalities.push({
        type: AbnormalityType.HighFluctuation,
        description: `Spending varies noticeably month to month. Higher than normal in:\n${highMonths.join("\n")}.`,
        fluctuation,
      });
    }
  } else if (fluctuation >= 1) {
    const extremeMonths = values
      .map((value, index) => value > median + 2 * stdDev ? `${months[index]} (${currencySymbol}${value.toLocaleString('en-US')})` : null)
      .filter(Boolean) as string[];

    if (extremeMonths.length > 0) {
      abnormalities.push({
        type: AbnormalityType.ExtremeFluctuation,
        description: `Spending is highly inconsistent with large ups and downs. Higher than normal in:\n${extremeMonths.join("\n")}.`,
        fluctuation,
      });
    }
  }
}

/** Helper function: Calculate median. */
function calculateMedian(values: number[]): number {
  const sortedValues = [...values].sort((a, b) => a - b);
  const n = sortedValues.length;
  return n % 2 === 0
    ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
    : sortedValues[Math.floor(n / 2)];
}




/** Detect upward trend with linear regressinon.
 * @param data The data to analyze
 * @param smoothingWindow The window size for moving average smoothing
 * 
 * @returns True if an upward trend is detected, false otherwise
 */
function isUpwardTrend(data: number[], smoothingWindow: number = 5): boolean {
  if (data.length <= 1) {
      return false; // No trend or insufficient data
  }

  console.log('raw data', data)

  // Apply moving average to smooth out fluctuations
  const smoothedData = movingAverage(data, smoothingWindow);

  console.log('smoothed data', smoothedData)

  // Calculate the linear regression slope (m) on the smoothed data
  const n = smoothedData.length;
  const sumX = (n - 1) * n / 2; // Sum of indices (0, 1, 2, ..., n-1)
  const sumY = smoothedData.reduce((sum, value) => sum + value, 0); // Sum of all smoothed data points
  const sumXY = smoothedData.reduce((sum, value, index) => sum + (index * value), 0); // Sum of x * y
  const sumX2 = smoothedData.reduce((sum, _, index) => sum + (index * index), 0); // Sum of x^2

  // Calculate the slope (m)
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const range = Math.max(...smoothedData) - Math.min(...smoothedData);

  // Calculate the mean of the smoothed data
  const meanY = sumY / n;

  // Normalize the slope to calculate growth rate as a percentage
  const growthRate = (m / meanY) * 100;
  

  // Handle edge case where range is 0
  if (range === 0) {
    return false; // No variation, no trend
  }

  const normalizedSlope = m / range;

  /** If the slope is positive, we have an upward trend. Ajdust the threshold as needed.
   * 0 means detect even slight upward trends. The larger the value, the more pronounced the trend must be.
   */
  return normalizedSlope > 0.002;
}
function movingAverage(data: number[], windowSize: number): number[] {
  const result = [];
  for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length - 1, i + Math.floor(windowSize / 2));
      const window = data.slice(start, end + 1);
      const avg = window.reduce((sum, num) => sum + num, 0) / window.length;
      result.push(avg);
  }
  return result;
}