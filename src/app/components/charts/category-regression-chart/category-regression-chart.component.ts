import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { AbnormalityChartdata } from '../../models';
import { ColorService } from '../../../services/color.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../../services/currency.service';
import { evaluateMetrics } from '../../../utils/utils';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-category-regression-chart',
  standalone: true,
  imports: [NgxEchartsDirective,
    MatChipsModule,
    CommonModule
  ],
  providers: [
    provideEcharts(),
    CurrencyPipe
  ],
  templateUrl: './category-regression-chart.component.html',
  styleUrl: './category-regression-chart.component.scss'
})
export class CategoryRegressionChartComponent implements OnChanges {
  @Input() chartData: AbnormalityChartdata

  colorService = inject(ColorService)
  currencyService = inject(CurrencyService)
  currencyPipe = inject(CurrencyPipe)

  chartOption: EChartsOption = this.getBaseOption()
  mergeOption: EChartsOption

  insights: string = ''
  trendDescription: string;

  trendMap: { [key: string]: string } = {
    'upward': 'Increasing',
    'downward': 'Decreasing',
    'neutral': 'Stable'
  };


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
        }
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
    const visibleParams = params.filter((item: any) => item.value !== 0);
    
    // If series type is bar chart, calculate total
    let tooltip = `${params[0].axisValueLabel}<br>`;
    
    tooltip += visibleParams.map((item: any) => `
      <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <div style="flex: 1; display: flex; align-items: center;">
          ${item.marker} ${item.seriesName}:
        </div>
        <div style="width: 16px;"></div>
        <div style="flex: 1; text-align: right;">
          <strong>${this.currencyPipe.transform(item.value, this.currencyService.getSelectedCurrency())}</strong>
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
    this.mergeOption = {
      ...this.getBaseOption(),
      xAxis: {
        type: 'category',
        data: this.chartData.xAxisData,
        axisLine: {
          lineStyle: {
            color: this.colorService.isDarkMode() ? '#B0B0B0' : this.colorService.lightTextSecondary,
          },
        },
      },
      series: [
        
        {
          name: `Actual Spending`,
          type: 'line',
          data: this.chartData.rawValues,
          showSymbol: false,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00', // Orange for both dark and light modes
          },
          lineStyle: {
            width: 2,
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#ff6f00',
          },
        },

        // {
        //   name: `Smoothed Data`,
        //   type: 'line',
        //   data: this.chartData.smoothedValues,
        //   showSymbol: false,
        //   itemStyle: {
        //     color: this.colorService.isDarkMode() ? 'green' : '#4682b4', // Blue for both dark and light modes
        //   },
        //   lineStyle: {
        //     width: 2,
        //     color: this.colorService.isDarkMode() ? 'green' : '#4682b4',
        //   },
        // },

        {
          name: `Prediction`,
          type: 'line',
          data: this.chartData.fittedValues,
          showSymbol: false,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4', // Blue for both dark and light modes
          },
          lineStyle: {
            width: 2,
            type: 'dashed',
            color: this.colorService.isDarkMode() ? '#1e90ff' : '#4682b4',
          },
        },
      ]
    }
  }
}
