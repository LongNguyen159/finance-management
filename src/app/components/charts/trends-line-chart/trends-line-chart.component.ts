import { Component, effect, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BarSeriesOption, EChartsOption, EChartsType, LineSeriesOption, SeriesOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { BaseChartComponent } from '../../../base-components/base-chart/base-chart.component';
import { TrendsLineChartData } from '../../models';
import { removeSystemPrefix } from '../../../utils/utils';
import { CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../../services/currency.service';
import { isArray } from 'mathjs';

@Component({
  selector: 'app-trends-line-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
    CurrencyPipe
  ],
  templateUrl: './trends-line-chart.component.html',
  styleUrl: './trends-line-chart.component.scss'
})
export class TrendsLineChartComponent extends BaseChartComponent implements OnChanges {
  @Input() chartData: TrendsLineChartData[] = [];
  @Input() showCategories: boolean = false;

  @Input() stackCategories: boolean = true;

  chartOptions: EChartsOption = this.getBaseOptions()
  mergeOptions: EChartsOption
  currencyPipe = inject(CurrencyPipe)
  currencyService = inject(CurrencyService)
  

  xAxisData: string[] = []

  constructor() {
    super()
    effect(() => {
      this.updateChart();
    })
  }

  getBaseOptions(): EChartsOption {
    return {
      series: [],
    };
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      this.updateChart();
    }
  }


  updateChart() {
    console.log("Show Categories: ", this.showCategories)
    const months = this.chartData.map(data => data.month);
    this.xAxisData = months;
    // Extract financial trends
    const totalNetIncome = this.chartData.map(data => data.totalNetIncome);
    const totalExpenses = this.chartData.map(data => data.totalExpenses);

    /** Clear Series before changing chart type to avoid conflicts.
     * 
    */
    this._clearSeries()

    const finalOptions: EChartsOption = {
      color: this.colorService.isDarkMode() ? this.colorService.chartColorPaletteDark : this.colorService.chartColorPaletteLight,
      tooltip: {
        borderColor: this.colorService.isDarkMode() ? '#484753' : '#E0E6F1',
        borderWidth: 2,
        borderRadius: 12,
        trigger: 'axis',
        axisPointer: {
          type: this.showCategories ? 'shadow' : 'line',
        },
        backgroundColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        formatter: (params: any) => {
          return this.getCustomTooltip(params, params[0].seriesType);
        },
      },
      legend: {
        type: 'scroll',
        itemGap: 22, // Space between legend items
        width: '80%',
        padding: 12,
        itemStyle: {
          opacity: this.showCategories ? 1 : 0,
        },
        lineStyle: {
          width: 10,
          inactiveWidth: 8,
          cap: 'round',
        },
        textStyle: {
          padding: 8,
          color: this.colorService.isDarkMode()
            ? this.colorService.darkTextPrimary
            : this.colorService.lightTextPrimary,
        },
        pageIconColor: this.colorService.isDarkMode() ? '#ffffff' : '#000000', // Arrows color
        pageIconInactiveColor: this.colorService.isDarkMode() ? '#555555' : '#cccccc', // Inactive arrow color
        pageTextStyle: {
          color: this.colorService.isDarkMode()
            ? this.colorService.darkTextPrimary
            : this.colorService.lightTextSecondary,
          fontSize: 12,
        },
        formatter: (name: string) => removeSystemPrefix(name),
        data: !this.showCategories ? 
        [
          {
            name: 'Net Income',
          }, 
          {
            name: 'Expenses',
          }, 
          {
            name: 'Predicted Net Income',
            lineStyle: {
              opacity: 1,
              width: 4,
              color: 'inherit',
            }
          }, 
          
          {
            name: 'Predicted Expenses',
            lineStyle: {
              opacity: 1,
              width: 4,
              color: 'inherit',
            }
          }, 
        ] : [
          ...this.chartData.flatMap(data => data.categories.map(cat => cat.name))
        ]
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: {
          lineStyle: {
            color: this.colorService.isDarkMode() ? '#B0B0B0' : this.colorService.lightTextSecondary,
          },
        },
      },
      yAxis: {
        type: 'value',
        splitLine: {
          show: true,
          lineStyle: {
            color: this.colorService.isDarkMode() ? '#484753' : '#E0E6F1',
          }
        },
        axisLine: {
          lineStyle: {
            color: this.colorService.isDarkMode() ? '#B0B0B0' : this.colorService.lightTextPrimary,
          },
        },
      },
      dataZoom: [
        {
          type: 'inside',
        }
      ],
      series: this.showCategories ? this._getCategoriesSeries() : this._getIncomeGrowthAndExpenseSeries(totalExpenses, totalNetIncome),
    };

    this.mergeOptions = finalOptions;
  }

  /** TODO:
   * Also map [x, y] pairs for the bar series. So this tooltip we will all use item.value[1] instead of item.value
   * 
   * Additionally, apply a different style fo the bars for predicted series.
   */
  getCustomTooltip(params: any, seriesType: string): string {
    // Filter out items with value 0
    const visibleParams = params.filter((item: any) => isArray(item.value) ?  item.value[1] !== 0 : item.value !== 0);
    
    // If series type is bar chart, calculate total
    let tooltip = `${params[0].axisValueLabel}<br>`;
    

    if (seriesType === 'bar') {
      // Calculate the total sum of values for the visible items (only for bar chart)
      const total = visibleParams.reduce((sum: number, item: any) => sum + item.value, 0);
    
      // Add individual items
      tooltip += visibleParams.map((item: any) => `
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
          <div style="flex: 1; display: flex; align-items: center;">
            ${item.marker} ${removeSystemPrefix(item.seriesName)}:
          </div>
          <div style="width: 16px;"></div>
          <div style="flex: 1; text-align: right;">
            <strong>${Math.round(item.value * 100) / 100}</strong>
          </div>
        </div>`).join('');
    
      // Add a divider before the total
      tooltip += `<hr style="margin: 8px 0; border: 0; border-top: 1px solid #ccc;">`;
  
      // Add total at the bottom
      tooltip += `
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
          <div style="flex: 1; display: flex; align-items: center;">
            <strong>Total:</strong>
          </div>
          <div style="width: 16px;"></div>
          <div style="flex: 1; text-align: right;">
            <strong>${this.currencyPipe.transform(total, this.currencyService.getSelectedCurrency())}</strong>
          </div>
        </div>`;
    } else {
      // For other series types, just show the individual items without the total
      tooltip += visibleParams.map((item: any) => `
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
          <div style="flex: 1; display: flex; align-items: center;">
            ${item.marker} ${item.seriesName}:
          </div>
          <div style="width: 16px;"></div>
          <div style="flex: 1; text-align: right;">
            <strong>${this.currencyPipe.transform(item.value[1], this.currencyService.getSelectedCurrency())}</strong>
          </div>
        </div>`).join('');
    }
  
    return tooltip;
  }

  /** Clear Chart series and data zoom */
  private _clearSeries() {
    let tempChartOptions: any = this._chartInstance?.getOption()
    if(tempChartOptions) {
      tempChartOptions['series'] = []
      tempChartOptions['dataZoom'] = []
      this._chartInstance?.setOption(tempChartOptions, true)
    }
  }



  /** Get Category Expenses data */
  private _getCategoriesSeries(): BarSeriesOption[] {
    // Extract all unique categories from the chartData
    const allCategories = Array.from(
      new Set(
        this.chartData.flatMap(data =>
          data.categories.map(cat => cat.name)
        )
      )
    );

  
    // Prepare category series aligned with xAxis data
    const categorySeries: BarSeriesOption[] = allCategories.map(category => ({
      name: category,
      type: 'bar',
      showSymbol: false,
      itemStyle: {
        opacity: 0.9,
      },
      stack: this.stackCategories ? 'categories' : '',
      data: this.xAxisData.map(month => {
        // Find the month's data
        const monthData = this.chartData.find(data => data.month === month);
        
        // if (!monthData) return 0; // If no data for this month, fill with 0
        
        // Find the category value for this month
        const categoryData = monthData?.categories.find(
          cat => cat.name === category
        );
        
        return Math.round((categoryData?.value || 0) * 100) / 100; // Default to 0 if missing
      }),
    }));
  
    return categorySeries;
  }

  /** Get Income Growth & Expense Trends data */
  private _getIncomeGrowthAndExpenseSeries(totalExpenses: number[], totalNetIncome: number[]): LineSeriesOption[] {
    // Split the data into actual and predicted segments
    const actualExpenses = [];
    const predictedExpenses = [];
    const actualNetIncome = [];
    const predictedNetIncome = [];
    
    /** Map Series into [x, y] pairs. Because prediction series starts after real series. */
    for (let i = 0; i < this.chartData.length; i++) {
      if (this.chartData[i].isPrediction) {
        // Pad the prediction series with the last value of the real series
        if (predictedExpenses.length === 0 && actualExpenses.length > 0) {
          const lastIndex = actualExpenses[actualExpenses.length - 1][0];
          const lastValue = actualExpenses[actualExpenses.length - 1][1];
          predictedExpenses.push([lastIndex, lastValue]);
          predictedNetIncome.push([lastIndex, actualNetIncome[actualNetIncome.length - 1][1]]);
        }
        predictedExpenses.push([i, totalExpenses[i]]);
        predictedNetIncome.push([i, totalNetIncome[i]]);
      } else {
        actualExpenses.push([i, totalExpenses[i]]);
        actualNetIncome.push([i, totalNetIncome[i]]);
      }
    }
  
  
    const trendSeries: LineSeriesOption[] = [
      {
        name: 'Expenses',
        type: 'line',
        data: actualExpenses.map(([x, y]) => [x, Math.round(y * 100) / 100]),
        smooth: true,
        showSymbol: false,
        itemStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode, // Red for expense
        },
        lineStyle: {
          width: 2,
          color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode, // Red for expense
        },
        areaStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode, // Red for expense
          opacity: 0.3
        }
      },
      {
        name: 'Predicted Expenses',
        type: 'line',
        data: predictedExpenses.map(([x, y]) => [x, Math.round(y * 100) / 100]),
        smooth: true,
        showSymbol: false,
        itemStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode, // Red for expense
        },
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode, // Red for expense
        },
        areaStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode, // Red for expense
          opacity: 0.1
        }
      },
      {
        name: 'Net Income',
        type: 'line',
        data: actualNetIncome.map(([x, y]) => [x, Math.round(y * 100) / 100]),
        smooth: true,
        showSymbol: false,
        itemStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode, // Green for income
        },
        lineStyle: {
          width: 2,
          color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode, // Green for income
        },
        areaStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode, // Green
          opacity: 0.3
        }
      },
      {
        name: 'Predicted Net Income',
        type: 'line',
        data: predictedNetIncome.map(([x, y]) => [x, Math.round(y * 100) / 100]),
        smooth: true,
        showSymbol: false,
        itemStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode, // Green for income
        },
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode, // Green for income
        },
        areaStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode, // Green
          opacity: 0.1
        }
      },
    ];
    return trendSeries;
  }}
