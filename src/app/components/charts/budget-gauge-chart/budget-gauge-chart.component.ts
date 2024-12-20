import { Component, effect, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { formatBigNumber } from '../../../utils/utils';
import { CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../../services/currency.service';
import { BaseChartComponent } from '../../../base-components/base-chart/base-chart.component';
@Component({
  selector: 'app-budget-gauge-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
    CurrencyPipe
  ],
  templateUrl: './budget-gauge-chart.component.html',
  styleUrl: './budget-gauge-chart.component.scss'
})
export class BudgetGaugeChartComponent extends BaseChartComponent implements OnChanges {
  @Input() budget: number = 0
  @Input() actualSpending: number = 1
  @Input() title: string = ''
  @Input() color: string = '#000'

  currencyService = inject(CurrencyService)

  chartOptions: EChartsOption = this.getBaseOptions()
  mergeOptions: EChartsOption = {}

  spendingPercentage: number = 0

  constructor() {
    super()
    effect(() => {
      this.updateChart()
    })
  }

  getBaseOptions(): EChartsOption {
    return {}
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['budget'] || changes['actualSpending'] || changes['color']) {
      this.updateChart()
    }
  }

  computeBudgetPercentage(): number {
    this.spendingPercentage = Math.round(this.actualSpending / this.budget * 100)
    return this.spendingPercentage
  }

  getColorBasedOnPercentage(): string {
    if (this.spendingPercentage <= 50) {
      return this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode; // Green
    } else if (this.spendingPercentage <= 75) {
      return this.colorService.isDarkMode() ? '#f5da5f' : 'rgb(242,201,107)'; // Yellow
    } else if (this.spendingPercentage <= 100) {
      return '#ffa550'; // Orange
    } else {
      return this.colorService.isDarkMode() ? 'rgb(221,83,76)' : '#ef4444'; // Red
    }
  }

  updateChart() {
    let formattedTitle = this.title;
    let fontSize = 20;

    if (this.title.includes('&')) {
      const [firstPart, secondPart] = this.title.split('&').map(part => part.trim());
      formattedTitle = `${firstPart} &\n${secondPart}`;
      fontSize = 16;  // Adjust font size for multi-line title
    }


    const gaugeData = [
      {
        value: this.computeBudgetPercentage(),
        name: formattedTitle,
      },
    ];

    

    
    this.mergeOptions = {
      series: [
        {
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          pointer: {
            show: false
          },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: {
              borderWidth: 1,
              // borderColor: '#464646'
              color: this.getColorBasedOnPercentage()
            }
          },
          axisLine: {
            lineStyle: {
              width: 20,
              color: this.colorService.isDarkMode() ? [[1, 'rgb(70,70,70)']] : [[1, 'rgb(240,240,240)']]
            }
          },
          splitLine: {
            show: false,
            distance: 0,
            length: 10
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            show: false,
            distance: 50
          },
          data: gaugeData,

          
          title: {
            fontSize: 22,
            offsetCenter: ['0%', '-30%'],
            fontWeight: 'bold',
            color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
          },


          detail: {
            // width: 50,
            // height: 14,
            fontSize: 16,
            color: this.getColorBasedOnPercentage(),
            // borderWidth: 1,
            formatter: () => {
              const actualSpending = Math.round(this.actualSpending * 100) / 100;
              const budget = this.budget;
              const difference = Math.abs(budget - actualSpending);
              const differenceFormatted =  formatBigNumber(difference, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency()));
            
              let comparisonMessage = '';
              if (actualSpending < budget) {
                comparisonMessage = `${differenceFormatted} left`;
              } else if (actualSpending > budget) {
                comparisonMessage = `${differenceFormatted} overspent`;
              } else {
                comparisonMessage = 'On budget';
              }
            
              return `(${this.computeBudgetPercentage()}%)\n${ formatBigNumber(actualSpending, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency()))} / ${ formatBigNumber(budget, this.currencyService.getCurrencySymbol(this.currencyService.getSelectedCurrency()))}\n${comparisonMessage}`;
            },
            valueAnimation: true,
            offsetCenter: ['0%', '30%']
          },
        }
      ]
    };
  }
}
