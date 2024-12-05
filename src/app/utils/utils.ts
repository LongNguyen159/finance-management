import { Abnormality, AbnormalityAnalysis, AbnormalityType, DifferenceItem, PieData, SYSTEM_PREFIX, TrendsLineChartData } from "../components/models";
import { evaluate } from 'mathjs/number';
import { PolynomialRegression } from 'ml-regression-polynomial';



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


//#region Abnormality Detection

/** Detect Anomalies in Spending of each Category. */
export function detectAbnormalities(
  data: TrendsLineChartData[],
  allMonths: string[],
  currencySymbol: string = '',
): AbnormalityAnalysis[] {
  const categoryMap = aggregateCategoryData(data, allMonths);

  // Analyze each category
  const analysis: AbnormalityAnalysis[] = Array.from(categoryMap.entries()).map(([name, { values, months }]) => {
    const nonZeroValues = values.filter(value => value > 0);
    const median = calculateMedian(nonZeroValues);
    const total = nonZeroValues.reduce((sum, value) => sum + value, 0);

    const stdDev = calculateStdDev(nonZeroValues, median);

    const abnormalities: Abnormality[] = [];
    const fluctuation = calculateFluctuation(nonZeroValues, median, stdDev);

    /** Detect Single Occurrence */
    const isSingleOccurrence = detectSingleOccurrence(values, months, abnormalities, currencySymbol);
    

    console.log('Category:', name)
    console.log('Values:', values)
    

    const result = detectTrend(values, 2, 5, 2, isSingleOccurrence);

    console.log(result)
    console.log('Fluctuation:', fluctuation)

    /** Detect Upward trend */
    if (result.trend == 'upward' && fluctuation < 0.5) {
      abnormalities.push({
        type: AbnormalityType.Growth,
        description: `Spending for ${removeSystemPrefix(name)} seems to have a rising pattern`,
      });
    }

    if (result.trend == 'upward' && fluctuation >= 0.5) {
      abnormalities.push({
        type: AbnormalityType.FluctuatingGrowth,
        description: `Your spending on ${removeSystemPrefix(name)} fluctuates a lot and tends to grow over time.`,
      });
    }
    
    console.log('-------------------')


    /** Detect Spikes & Fluctuations */
    const spikeIndices = detectSpikes(values, months, abnormalities, median, stdDev, currencySymbol);
    detectFluctuations(values, months, abnormalities, fluctuation, median, stdDev, currencySymbol, spikeIndices);

    const cleanedName = removeSystemPrefix(name);
    return { 
      name: cleanedName, 
      abnormalities,
      categoryName: name,
      totalSpending: isSingleOccurrence ? 0 : Math.round(total * 100) / 100,

      rawValues: values,
      xAxisData: allMonths,
      fittedValues: result.fittedValues,
      smoothedData: result.smoothedData,

      detailedAnalysis: result,
    };
  });

  /** Filter out categories with no anomalies. */
  return analysis
}

/** Evaluate Trend metrics and return a natural language string */
export function evaluateMetrics(categoryName: string, growthRate: number, trend: 'upward' | 'downward' | 'neutral', strength: 'weak' | 'moderate' | 'strong'): string {
  let result = '';

  // Evaluate trend
  switch (trend) {
    case 'upward':
      result += `${categoryName} has increased `;
      break;
    case 'downward':
      result += `${categoryName} has decreased `;
      break;
    case 'neutral':
      result += `${categoryName} has remained stable `;
      break;
  }

  // Evaluate growth rate
  if (growthRate !== 0) {
    result += `by ${Math.abs(growthRate).toFixed(2)}% `;
  } else {
    result += `with no significant change `;
  }

  // Evaluate strength
  switch (strength) {
    case 'strong':
      result += `with a strong and clear trend.`;
      break;
    case 'moderate':
      result += `with a moderate and noticeable trend.`;
      break;
    case 'weak':
      result += `with a minimal trend.`;
      break;
  }

  return result;
}


//#region Helper Functions
/** Step 1: Aggregate data by category. */
function aggregateCategoryData(
  data: TrendsLineChartData[],
  allMonths: string[]
): Map<string, { values: number[]; months: string[] }> {
  const categoryMap = new Map<string, { values: number[]; months: string[] }>();

  // Initialize the map with all categories and months set to 0
  data.forEach(monthData => {
    monthData.categories.forEach(category => {
      if (!categoryMap.has(category.name)) {
        categoryMap.set(category.name, {
          values: Array(allMonths.length).fill(0), // Start with all months set to 0
          months: [...allMonths],
        });
      }
    });
  });

  // Populate the data into the correct months
  data.forEach(monthData => {
    monthData.categories.forEach(category => {
      const categoryEntry = categoryMap.get(category.name)!;
      const monthIndex = allMonths.indexOf(monthData.month);
      if (monthIndex !== -1) {
        categoryEntry.values[monthIndex] = category.value; // Update with actual value
      }
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
function detectSingleOccurrence(values: number[], months: string[], abnormalities: Abnormality[], currencySymbol: string): boolean {
  if (values.filter(value => value > 0).length === 1) {
    const singleIndex = values.findIndex(value => value > 0);
    abnormalities.push({
      type: AbnormalityType.SingleOccurrence,
      description: `One-time expense recorded in ${months[singleIndex]}: ${currencySymbol}${values[singleIndex].toLocaleString('en-US')}.`,
      month: months[singleIndex],
      value: values[singleIndex],
    });
    return true;
  }
  return false;
}

/** Step 5: Detect spikes. */
function detectSpikes(
  values: number[],
  months: string[],
  abnormalities: Abnormality[],
  median: number,
  stdDev: number,
  currencySymbol: string
): Set<number> {
  const spikeIndices = new Set<number>();

  values.forEach((value, index) => {
    if (value > median + 1.5 * stdDev) {
      spikeIndices.add(index); // Add the month index to the spike set
      abnormalities.push({
        type: AbnormalityType.Spike,
        description: `Spending spike in ${months[index]}: ${currencySymbol}${value.toLocaleString('en-US')}.`,
        month: months[index],
        value: value,
      });
    }
  });

  return spikeIndices;
}

/** Step 6: Detect fluctuations. */
function detectFluctuations(
  values: number[],
  months: string[],
  abnormalities: Abnormality[],
  fluctuation: number,
  median: number,
  stdDev: number,
  currencySymbol: string,
  excludedIndices: Set<number>
): void {
  if (fluctuation >= 0.5 && fluctuation < 1) {
    const highMonths = values
      .map((value, index) =>
        !excludedIndices.has(index) && value > median + stdDev
          ? `${months[index]} (${currencySymbol}${value.toLocaleString('en-US')})`
          : null
      )
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
      .map((value, index) =>
        !excludedIndices.has(index) && value > median + 2 * stdDev
          ? `${months[index]} (${currencySymbol}${value.toLocaleString('en-US')})`
          : null
      )
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

//#endregion


//#region Upward Trend Detection

/** Moving Average to calculate the average in a range (in a window size), then move to next
 * window to calculate the average again. This helps smoothing out the noise.
 */
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


/** Detect Trend and their instensity using Regression. Fallback to linear if not enough data points.
 * @param data The input data to analyze
 * @param degree The degree of the polynomial regression (default: 1 for linear)
 * @param smoothingWindow The window size for moving average smoothing (default: 5)
 * @param sensitivity The sensitivity factor for trend strength (default: 1.5)
 * @param isSingleOccurrence Whether to detect single occurrences (default: false). If true, early exit with neutral trend.
 * 
 * @returns The trend, strength, growth rate, smoothed data, fitted values, and model description
 * 
 */
function detectTrend(
  data: number[],
  degree: number = 1,
  smoothingWindow: number = 5,
  sensitivity: number = 1.5,
  isSingleOccurrence: boolean = false
): {
  trend: 'upward' | 'downward' | 'neutral';
  strength: 'weak' | 'moderate' | 'strong';
  growthRate: number;
  smoothedData: number[];
  fittedValues: number[];
  model: string;
} {
  // Step 0: Handle insufficient data
  if (data.length <= 1) {
    return {
      trend: 'neutral',
      strength: 'weak',
      growthRate: 0,
      smoothedData: data,
      fittedValues: data,
      model: 'Insufficient data for analysis',
    };
  }

  if (isSingleOccurrence) {
    return {
      trend: 'neutral',
      strength: 'weak',
      growthRate: 0,
      smoothedData: data,
      fittedValues: data,
      model: 'Single occurrence detected',
    };
  }

  // Step 1: Smooth the data using a moving average
  const smoothedData = movingAverage(data, smoothingWindow);

  // Step 2: Prepare X and Y arrays for regression
  const dataX = smoothedData.map((_, index) => index);
  const dataY = smoothedData;

  // Step 3: Adjust degree if necessary
  if (degree >= smoothedData.length) {
    console.warn(`Degree (${degree}) is too high for data length (${smoothedData.length}). Falling back to linear regression.`);
    degree = 1;
  }

  let regression: PolynomialRegression;
  let fittedValues: number[] = [];
  let slope: number = 0;
  let model: string = '';

  try {
    // Step 4: Perform polynomial regression
    regression = new PolynomialRegression(dataX, dataY, degree);
    fittedValues = dataX.map(x => regression.predict(x));
  } catch (error) {
    console.error('Error performing regression:', error);

    // Safe fallback for regression failures
    slope = 0;
    fittedValues = Array(dataY.length).fill(smoothedData[0]); // Flat line fallback
    model = 'Regression failed, returning flat line';

    // Calculate growth rate based on start-to-end difference
    const growthRate = smoothedData[0] !== 0
    ? ((smoothedData[smoothedData.length - 1] - smoothedData[0]) / smoothedData[0]) * 100
    : 0; // Avoid division by 0


    return {
      trend: growthRate > 0 ? 'upward' : growthRate < 0 ? 'downward' : 'neutral',
      strength: 'weak',
      growthRate,
      smoothedData,
      fittedValues,
      model,
    };
  }

  // Step 5: Analyze trend and strength
  let growthRate = 0;

  if (smoothedData[0] === 0) {
    // If start is 0, growth rate could be calculated as total increase divided by the final value
    growthRate = smoothedData[smoothedData.length - 1] * 100;  // End value * 100 (since start is 0)
  } else {
    growthRate = ((smoothedData[smoothedData.length - 1] - smoothedData[0]) / smoothedData[0]) * 100;
  }

  // Step 6: Calculate the derivative manually
  const avgSlope = calculateAverageSlope(regression.coefficients, dataX.length);

  console.log('Avg Slope:', avgSlope)
  console.log('Growth Rate:', growthRate)

  // Step 7: Determine trend and strength based on growth rate and average slope
  let trend: 'upward' | 'downward' | 'neutral' = 'neutral';
  let strength: 'weak' | 'moderate' | 'strong' = 'weak';

  // Classification logic using both growthRate and avgSlope
  if (growthRate < 0) {
    trend = 'downward';
  } else if (growthRate > 0) {
    trend = 'upward';
  } else {
    trend = 'neutral';
  }
  
  // Adjust trend or add warnings if avgSlope conflicts
  if ((growthRate > 0 && avgSlope < 0) || (growthRate < 0 && avgSlope > 0)) {
    console.warn('Conflicting indicators: growthRate and avgSlope differ');
    // Optionally, refine classification based on weights
    const trendIndicator = 0.7 * growthRate + 0.3 * avgSlope;
    if (trendIndicator > 0) {
      trend = 'upward';
    } else if (trendIndicator < 0) {
      trend = 'downward';
    } else {
      trend = 'neutral';
    }
  }
  
  // Strength adjustment remains unchanged
  if (Math.abs(growthRate) > 50 || Math.abs(avgSlope) > sensitivity * 2.2) {
    strength = 'strong';
  } else if (Math.abs(growthRate) > 20 || Math.abs(avgSlope) > sensitivity) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }



  // Step 8: Return the results
  return {
    trend,
    strength,
    growthRate,
    smoothedData,
    fittedValues,
    model,
  };
}
/**
 * Calculate the average slope from the derivative at start, middle, and end.
 * @param coefficients Polynomial coefficients from regression
 * @param dataLength The length of the data
 * @returns The average slope
 */
function calculateAverageSlope(coefficients: number[], dataLength: number): number {
  // Polynomial: c0 + c1*x + c2*x^2 + ... + cn*x^n
  // Derivative: c1 + 2*c2*x + 3*c3*x^2 + ... + n*cn*x^(n-1)

  /**
   * Calculate the derivative at a specific x
   * @param x The x value
   * @returns The derivative value at x
   */
  function derivativeAt(x: number): number {
    return coefficients
      .map((coeff, index) => (index === 0 ? 0 : coeff * index * Math.pow(x, index - 1)))
      .reduce((sum, val) => sum + val, 0);
  }

  const midIndex = Math.floor(dataLength / 2);
  const startSlope = derivativeAt(0);
  const midSlope = derivativeAt(midIndex);
  const endSlope = derivativeAt(dataLength - 1);

  const avgSlope = (startSlope + midSlope + endSlope) / 3;
  return avgSlope;
}
//#endregion

//#endregion