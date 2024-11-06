import { Component, effect, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { ColorService } from '../../../services/color.service';

@Component({
  selector: 'app-budget-gauge-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './budget-gauge-chart.component.html',
  styleUrl: './budget-gauge-chart.component.scss'
})
export class BudgetGaugeChartComponent implements OnInit, OnChanges {
  @Input() budget: number = 0
  @Input() actualSpending: number = 1
  @Input() title: string = ''
  @Input() color: string = '#000'

  colorService = inject(ColorService)

  chartOptions: EChartsOption

  spendingPercentage: number = 0

  constructor() {
    effect(() => {
      this.updateChart()
    })
  }

  ngOnInit(): void {
    // this.updateChart()
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
      return this.colorService.isDarkMode() ? 'rgb(157, 202, 127)' : 'rgb(157, 202, 127)'; // Green
    } else if (this.spendingPercentage <= 75) {
      return this.colorService.isDarkMode() ? '#f5da5f' : 'rgb(242,201,107)'; // Yellow
    } else if (this.spendingPercentage <= 100) {
      return '#ffa550'; // Orange
    } else {
      return this.colorService.isDarkMode() ? 'rgb(221,83,76)' : '#ef4444'; // Red
    }
  }

  updateChart() {
    const gaugeData = [
      {
        value: this.computeBudgetPercentage(),
        name: this.title,
        title: {
          offsetCenter: ['0%', '-30%'],
        },
        detail: {
          valueAnimation: true,
          offsetCenter: ['0%', '30%']
        }
      },
    ];

    
    this.chartOptions = {
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
              // width: 40
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
            fontSize: 20,
            fontWeight: 'bold',
            color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
          },
          detail: {
            width: 50,
            height: 14,
            fontSize: 14,
            color: this.getColorBasedOnPercentage(),
            // borderColor: 'inherit',
            borderRadius: 20,
            borderWidth: 1,
            formatter: '{value}%'
          }
        }
      ]
    };
  }
}
