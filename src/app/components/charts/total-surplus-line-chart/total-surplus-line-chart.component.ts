import { Component, Input, OnChanges, SimpleChanges, effect, inject } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { ColorService } from '../../../services/color.service';

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
  @Input() chartData: { month: string; surplus: number }[] = [];

  colorService = inject(ColorService);
  chartOptions: EChartsOption = {};

  constructor() {
    effect(() => {
      this.setChartOptions();
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['chartData']) {
      this.setChartOptions();
    }
  }

  setChartOptions() {
    const months = this.chartData.map(data => data.month);
    const surplusValues = this.chartData.map(data => data.surplus);

    this.chartOptions = {
      title: {
        text: 'Monthly Surplus',
        left: 'center',
        textStyle: {
          fontSize: 22,
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
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
        axisLine: {
          lineStyle: {
            color: this.colorService.isDarkMode() ? '#B0B0B0' : this.colorService.lightTextPrimary,
          },
        },
      },
      series: [
        {
          name: 'Surplus',
          type: 'line',
          data: surplusValues,
          smooth: true,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#5470c6', // Customize colors for dark/light mode
          },
          lineStyle: {
            width: 2,
            color: this.colorService.isDarkMode() ? '#ff7f50' : '#5470c6',
          },
          areaStyle: {
            color: this.colorService.isDarkMode() ? 'rgba(255, 127, 80, 0.3)' : 'rgba(84, 112, 198, 0.3)',
          },
        },
      ],
    };
  }
}
