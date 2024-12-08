import { Component, effect, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { AbnormalityChartdata } from '../../models';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../../services/currency.service';
import { evaluateMetrics, getNextMonths, MONTHS_TO_PREDICT } from '../../../utils/utils';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartComponent } from '../../../base-components/base-chart/base-chart.component';

@Component({
  selector: 'app-category-regression-chart',
  standalone: true,
  imports: [NgxEchartsDirective,
    MatChipsModule,
    CommonModule,
    MatButtonModule
  ],
  providers: [
    provideEcharts(),
    CurrencyPipe
  ],
  templateUrl: './category-regression-chart.component.html',
  styleUrl: './category-regression-chart.component.scss'
})
export class CategoryRegressionChartComponent extends BaseChartComponent implements OnChanges {
  @Input() chartData: AbnormalityChartdata

  currencyService = inject(CurrencyService)
  currencyPipe = inject(CurrencyPipe)

  chartOption: EChartsOption = this.getBaseOption()
  mergeOption: EChartsOption

  insights: string = ''
  trendDescription: string;
  isBoundSelected: boolean = true;

  trendMap: { [key: string]: string } = {
    'upward': 'Increasing',
    'downward': 'Decreasing',
    'neutral': 'Stable'
  };

  constructor() {
    super()
    effect(() => {
      this.updateChart()
    })
  }



  getBaseOption(): EChartsOption {
    return {
      tooltip: {
        borderColor: this.colorService.isDarkMode() ? '#484753' : '#E0E6F1',
        borderWidth: 2,
        borderRadius: 12,
        trigger: 'axis',
        backgroundColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        formatter: (params: any) => {
          return this.getCustomTooltip(params);
        },
      },
      
      legend: {
        itemGap: 22,
        textStyle: {
          padding: 8,
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        itemStyle: {
          opacity: 0,
        },
        lineStyle: {
          width: 10,
          inactiveWidth: 8,
          cap: 'round',
        },
        data: [{
          name: 'Actual Spending',
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00',
          },
        }, {
          name: 'Prediction',
          lineStyle: {
            opacity: 1,
            width: 4,
            color: 'inherit',
          }

        }, {
          name: 'Upper & Lower Bound',
          lineStyle: {
            opacity: 1,
            width: 4,
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4', // Blue for both dark and light modes
          }
        }, 
      ]
      },
      xAxis: {
        type: 'category',
        data: [],
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
      series: []
    };
  }

  getCustomTooltip(params: any): string {
    // Filter out items with value 0
    const visibleParams = params.filter((item: any) => item.seriesName !== 'Upper & Lower Bound');
    
    // If series type is bar chart, calculate total
    let tooltip = `${params[0].axisValueLabel}<br>`;
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
  
    return tooltip;
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      this.updateChart()
      this.getTrendDetails()
    }
  }

  getTrendDetails() {
    this.insights = evaluateMetrics(this.chartData.categoryName, this.chartData.details.growthRate, this.chartData.details.trend, this.chartData.details.strength)
    this.trendDescription = this.trendMap[this.chartData.details.trend];
  }

  updateChart() {  
    // Get the next X months (e.g., 3 months ahead) from the last date in xAxisData
    const nextMonths: string[] = getNextMonths(this.chartData.xAxisData[this.chartData.xAxisData.length - 1], MONTHS_TO_PREDICT);
    /** Push into xAxis the months to predict also, to contain the 'Prediction' line */
    const xAxisData: string[] = [...this.chartData.xAxisData];
    xAxisData.push(...nextMonths);
  
    /** Map data to [index, value] pairs:
     * Because we want the "prediction" line to start from the last point of the raw data.
     */
    const rawDataMapped: number[][] = this.chartData.rawValues.map((value, index) => [index, value]);
    // const fittedValuesMapped = this.chartData.details.fittedValues.map((value, index) => [index, value]);

    const forecast: number[] = this.chartData.details.predictedValues?.forecast[0] || []
    const positiveForecast: number[] = forecast.map((value) => Math.max(0, value));

    const errors: number[] = this.chartData.details.predictedValues?.forecast[1] || [];


    const errorScaleFactor = 10;
    const scaledErrors = errors.map((error) => error / errorScaleFactor);

    /** Only take positive values */
    const upperBound: number[] = forecast.map((val, i) => Math.max(0, val + scaledErrors[i]));
    const lowerBound: number[] = forecast.map((val, i) => Math.max(0, val - scaledErrors[i]));
  
    // Map predicted data to [index, value] pairs, starting from the next index after the raw data
    const predictedDataMapped: number[][] = [
      [this.chartData.rawValues.length - 1, this.chartData.rawValues[this.chartData.rawValues.length - 1]],
      ...positiveForecast.map((value, index) => [this.chartData.rawValues.length + index, value]),
    ];

    const mappedUpperBound: number[][] = [
      [this.chartData.rawValues.length - 1, this.chartData.rawValues[this.chartData.rawValues.length - 1]],
      ...upperBound.map((value, index) => [this.chartData.rawValues.length + index, value]),
    ];

    const mappedLowerBound: number[][] = [
      [this.chartData.rawValues.length - 1, this.chartData.rawValues[this.chartData.rawValues.length - 1]],
      ...lowerBound.map((value, index) => [this.chartData.rawValues.length + index, value]),
    ];


    // Update chart options with the mapped data
    this.mergeOption = {
      ...this.getBaseOption(),
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: {
          lineStyle: {
            color: this.colorService.isDarkMode() ? '#B0B0B0' : this.colorService.lightTextSecondary,
          },
        },
      },
      legend: {
        selectedMode: false,
        selected: {
          'Upper Bound': this.isBoundSelected,
          'Lower Bound': this.isBoundSelected,
          'Upper & Lower Bound': this.isBoundSelected,
          'Actual Spending': true,  // Assuming it's always visible
          'Prediction': true,      // Assuming it's always visible
        },
      },
      series: [
        {
          name: `Actual Spending`,
          type: 'line',
          data: rawDataMapped,
          showSymbol: false,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00', // Orange for both dark and light modes
          },
          lineStyle: {
            width: 2,
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00',
          },
        },
        {
          name: 'Upper Bound',
          type: 'line',
          clip: true,
          lineStyle: {
            type: 'solid',
            opacity: 0,
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4', // Blue for both dark and light modes
          },
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4', // Blue for both dark and light modes
          },
          smooth: true,
          data: mappedUpperBound,
          showSymbol: false,
          z: -1,
        },

        {
          name: 'Upper & Lower Bound',
          type: 'line',
          clip: true,
          smooth: true,
          showSymbol: false,
          data: [
            ...mappedUpperBound, // Upper Bound in normal order
            ...mappedLowerBound.reverse(), // Lower Bound in reverse order
          ],
          areaStyle: {
            color: this.colorService.isDarkMode()
              ? 'rgba(30,144,255)'
              : 'rgba(70,130,180)', // Light blue with transparency
            opacity: 0.2,
          },
          itemStyle: {
            opacity: 1,
            color: this.colorService.isDarkMode()
              ? 'rgba(30,144,255)'
              : 'rgba(70,130,180)', // Light blue with transparency
          },
          lineStyle: {
            opacity: 0,
          },
          silent: true,
          z: -2, // Ensure it is behind the other series
        },

        {
          name: `Prediction`,
          type: 'line',
          data: predictedDataMapped,
          showSymbol: false,
          itemStyle: {
            borderType: 'dashed',
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00',
          },
          lineStyle: {
            width: 2,
            type: 'dashed',
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00',
          },
        },


        {
          name: 'Lower Bound',
          type: 'line',
          clip: true,
          smooth: true,
          lineStyle: {
            type: 'solid',
            opacity: 0,
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4', // Blue for both dark and light modes
          },
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4', // Blue for both dark and light modes
          },
          data: mappedLowerBound,
          showSymbol: false,
          z: -1
        },
      ]
    }
  }
}
