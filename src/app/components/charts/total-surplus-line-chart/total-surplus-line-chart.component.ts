import { Component, Input, OnChanges, SimpleChanges, effect, inject } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { TrendsLineChartData } from '../../models';
import { BaseChartComponent } from '../../../base-components/base-chart/base-chart.component';
import { CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../../services/currency.service';

@Component({
  selector: 'app-total-surplus-line-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
    CurrencyPipe
  ],
  templateUrl: './total-surplus-line-chart.component.html',
  styleUrls: ['./total-surplus-line-chart.component.scss'],
})
export class TotalSurplusLineChartComponent extends BaseChartComponent implements OnChanges {
  @Input() chartData: TrendsLineChartData[] = [];

  chartOptions: EChartsOption = this.getBaseOption()
  mergeOptions: EChartsOption = {};
  currencyPipe = inject(CurrencyPipe);
  currencyService = inject(CurrencyService);

  constructor() {
    super()
    effect(() => {
      this.updateChart();
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
        formatter: (param: any) => {
          return this.getCustomTooltip(param);
        }
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
        data: [
          {
            name: 'Surplus',
          }, 
          {
            name: 'Balance',
          }, 
          {
            name: 'Predicted Surplus',
            lineStyle: {
              opacity: 1,
              width: 4,
              color: 'inherit',
            }
          }, 
          
          {
            name: 'Predicted Balance',
            lineStyle: {
              opacity: 1,
              width: 4,
              color: 'inherit',
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
      series: []
    };

  }

  getCustomTooltip(params: any): string {
    // Filter out items with value 0
    const visibleParams = params
    
    // If series type is bar chart, calculate total
    let tooltip = `${params[0].axisValueLabel}<br>`;
    tooltip += visibleParams.map((item: any) => `
      <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <div style="flex: 1; display: flex; align-items: center;">
          ${item.marker} ${item.seriesName}:
        </div>
        <div style="width: 22px;"></div>
        <div style="flex: 1; text-align: right;">
          <strong>${this.currencyPipe.transform(item.value[1], this.currencyService.getSelectedCurrency())}</strong>
        </div>
      </div>`).join('');
  
    return tooltip;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['chartData']) {
      this.updateChart();
    }
  }

  updateChart() {
    const months = this.chartData.map(data => data.month);
    const surplusValues = this.chartData.map(data => data.surplus);
    const balanceValues = this.chartData.map(data => data.balance);


    // Split the data into actual and predicted segments
    const actualSurplusValues = [];
    const predictedSurplusValues = [];
    const actualBalance = [];
    const predictedBalance = [];
    
    /** Map Series into [x, y] pairs. Because prediction series starts after real series. */
    for (let i = 0; i < this.chartData.length; i++) {
      if (this.chartData[i].isPrediction) {
        // Pad the prediction series with the last value of the real series
        if (predictedSurplusValues.length === 0 && actualSurplusValues.length > 0) {
          const lastIndex = actualSurplusValues[actualSurplusValues.length - 1][0];
          const lastValue = actualSurplusValues[actualSurplusValues.length - 1][1];
          predictedSurplusValues.push([lastIndex, lastValue]);
          predictedBalance.push([lastIndex, actualBalance[actualBalance.length - 1][1]]);
        }
        predictedSurplusValues.push([i, surplusValues[i]]);
        predictedBalance.push([i, balanceValues[i]]);
      } else {
        actualSurplusValues.push([i, surplusValues[i]]);
        actualBalance.push([i, balanceValues[i]]);
      }
    }
  

    this.mergeOptions = {
      ...this.getBaseOption(),
      xAxis: {
        type: 'category',
        data: months,
        axisLine: {
          lineStyle: {
            color: this.colorService.isDarkMode() ? '#B0B0B0' : this.colorService.lightTextSecondary,
          },
        },
      },
      series: [
        {
          name: 'Surplus',
          type: 'line',
          data: actualSurplusValues.map(([x, y]) => [x, Math.round(y * 100) / 100]),
          smooth: true,
          showSymbol: false,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00', // Orange for both dark and light modes
          },
          lineStyle: {
            width: 2,
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00',
          },
          areaStyle: {
            color: this.colorService.isDarkMode() ? 'rgba(255, 127, 80, 0.3)' : 'rgba(255, 165, 0, 0.3)', // Light orange for background
          },
        },
        {
          name: 'Balance',
          type: 'line',
          data: actualBalance.map(([x, y]) => [x, Math.round(y * 100) / 100]),
          smooth: true,
          showSymbol: false,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4', // Blue for both dark and light modes
          },
          lineStyle: {
            width: 2,
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4',
          },
          areaStyle: {
            color: this.colorService.isDarkMode() ? 'rgba(30, 144, 255, 0.3)' : 'rgba(70, 130, 180, 0.3)', // Light blue for background
          },
        },

        {
          name: 'Predicted Balance',
          type: 'line',
          data: predictedBalance.map(([x, y]) => [x, Math.round(y * 100) / 100]),
          smooth: true,
          showSymbol: false,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4', // Blue for both dark and light modes
          },
          lineStyle: {
            width: 2,
            type: 'dashed',
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4',
          },
          areaStyle: {
            color: this.colorService.isDarkMode() ? 'rgba(30, 144, 255, 0.2)' : 'rgba(70, 130, 180, 0.2)', // Light blue for background
          },
        },

        {
          name: 'Predicted Surplus',
          type: 'line',
          data: predictedSurplusValues.map(([x, y]) => [x, Math.round(y * 100) / 100]),
          smooth: true,
          showSymbol: false,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00', // Orange for both dark and light modes
          },
          lineStyle: {
            width: 2,
            type: 'dashed',
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00',
          },
          areaStyle: {
            color: this.colorService.isDarkMode() ? 'rgba(255, 127, 80, 0.2)' : 'rgba(255, 165, 0, 0.2)', // Light orange for background
          },
        },
      ]
    };
  }
}
