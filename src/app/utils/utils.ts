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
export function detectAbnormalities(data: TrendsLineChartData[], currencySymbol: string = ''): AbnormalityAnalysis[] {
  // Step 1: Aggregate all categories
  const categoryMap = new Map<string, { values: number[]; months: string[] }>();

  data.forEach(monthData => {
    monthData.categories.forEach(category => {
      const categoryName = category.name;
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { values: [], months: [] });
      }
      const categoryEntry = categoryMap.get(categoryName)!;
      categoryEntry.values.push(category.value);
      categoryEntry.months.push(monthData.month);
    });
  });

  // Step 2: Detect abnormalities in each category
  const analysis: AbnormalityAnalysis[] = Array.from(categoryMap.entries()).map(([name, { values, months }]) => {
    const nonZeroValues = values.filter(value => value > 0);
    const average = nonZeroValues.reduce((sum, val) => sum + val, 0) / nonZeroValues.length;

    // Standard deviation calculation
    const variance = nonZeroValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / nonZeroValues.length;
    const stdDev = Math.sqrt(variance);

    const abnormalities: Abnormality[] = [];

    // Abnormality 1: Single occurrence
    if (nonZeroValues.length === 1) {
      const singleIndex = values.findIndex(value => value > 0);
      abnormalities.push({
        type: AbnormalityType.SingleOccurrence,
        description: `One-time expense recorded in ${months[singleIndex]}: ${currencySymbol}${values[singleIndex].toLocaleString('en-US')}.`,
        month: months[singleIndex],
        value: values[singleIndex],
      });
    }

    // Abnormality 2: Spikes
    values.forEach((value, index) => {
      if (value > average + 2 * stdDev) {
        abnormalities.push({
          type: AbnormalityType.Spike,
          description: `Spending spike in ${months[index]}: ${currencySymbol}${value.toLocaleString('en-US')}.`,
          month: months[index],
          value: value,
        });
      }
    });

    // Abnormality 3: High fluctuation
    if (nonZeroValues.length > 1) {
      const fluctuation = stdDev / average;
      if (fluctuation >= 0.5 && fluctuation < 1) {
        // Detecting months where spending is higher than the usual
        const highMonths = values
          .map((value, index) => value > average + stdDev ? `${months[index]} (${currencySymbol}${value.toLocaleString('en-US')})` : null)
          .filter(Boolean) as string[];

        if (highMonths.length > 0) {
          abnormalities.push({
            type: AbnormalityType.HighFluctuation,
            description: `Spending varies noticeably month to month.\nHigher than normal in:\n${highMonths.join("\n")}.`,
            fluctuation,
          });
        }
      } else if (fluctuation >= 1) {
        // Detecting extreme fluctuations
        const extremeMonths = values
          .map((value, index) => value > average + 2 * stdDev ? `${months[index]} (${currencySymbol}${value.toLocaleString('en-US')})` : null)
          .filter(Boolean) as string[];

        if (extremeMonths.length > 0) {
          abnormalities.push({
            type: AbnormalityType.ExtremeFluctuation,
            description: `Spending is highly inconsistent with large ups and downs.\nHigher than normal in:\n${extremeMonths.join("\n")}.`,
            fluctuation,
          });
        }
      }
    }
    
    const cleanedName = removeSystemPrefix(name);

    return { name: cleanedName, abnormalities, categoryName: name };
  });

  return analysis.filter(category => category.abnormalities.length > 0); // Exclude categories without abnormalities
}
