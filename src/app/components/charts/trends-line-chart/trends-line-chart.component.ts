import { Component, effect, Input } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { BaseChartComponent } from '../../../base-components/base-chart/base-chart.component';

@Component({
  selector: 'app-trends-line-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './trends-line-chart.component.html',
  styleUrl: './trends-line-chart.component.scss'
})
export class TrendsLineChartComponent extends BaseChartComponent {
  @Input() chartData: any

  chartOptions: EChartsOption = this.getBaseOptions()
  mergeOptions: EChartsOption

  constructor() {
    super()
    effect(() => {
      this.updateChart();
    })
  }

  getBaseOptions(): EChartsOption {
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


  updateChart() {

  }

}
