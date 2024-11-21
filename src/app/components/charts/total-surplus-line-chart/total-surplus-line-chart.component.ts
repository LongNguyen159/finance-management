import { Component, Input, OnChanges, SimpleChanges, effect, inject } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { ColorService } from '../../../services/color.service';
import { SurplusBalanceLineChartData } from '../../models';

@Component({
  selector: 'app-total-surplus-line-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './total-surplus-line-chart.component.html',
  styleUrls: ['./total-surplus-line-chart.component.scss'],
})
export class TotalSurplusLineChartComponent implements OnChanges {
  @Input() chartData: SurplusBalanceLineChartData[] = [];

  colorService = inject(ColorService);
  chartOptions: EChartsOption = this.getBaseOption()
  mergeOptions: EChartsOption = {};

  constructor() {
    effect(() => {
      this.updateChart();
    })
  }

  getBaseOption(): EChartsOption {
    return {
      darkMode: this.colorService.isDarkMode(),
      tooltip: {
        trigger: 'axis',
        backgroundColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['chartData']) {
      this.updateChart();
    }
  }

  updateChart() {
    const months = this.chartData.map(data => data.month);
    const surplusValues = this.chartData.map(data => data.surplus);
    const balanceValues = this.chartData.map(data => data.balance);

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
          data: surplusValues,
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
          data: balanceValues,
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
      ]
    };
  }
}
