import { CommonModule } from '@angular/common';
import { Component, effect, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EChartsOption, SeriesOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService } from '../../../services/data.service';
import { ColorService } from '../../../services/color.service';

@Component({
  selector: 'app-income-expense-ratio-chart',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './income-expense-ratio-chart.component.html',
  styleUrls: ['./income-expense-ratio-chart.component.scss']
})
export class IncomeExpenseRatioChartComponent implements OnChanges {
  @Input() totalIncome: number = 0;
  @Input() totalExpense: number = 0;

  dataService = inject(DataService)
  colorService = inject(ColorService)

  barWidth: string = '10%'
  chartOption: EChartsOption = this.getBaseChartOptions();

  constructor() {
    effect(() => {
      this.updateChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalIncome'] || changes['totalExpense']) {
      this.updateChart();
    }
  }

  getBaseChartOptions(): EChartsOption {
    return {
      tooltip: {
        trigger: 'axis',
        position: function (pos, params, dom, rect, size) {
          // tooltip will be fixed on the right if mouse hovering on the left,
          // and on the left if hovering on the right.
          var obj: any = {top: 60};
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
          return obj;
        },
        axisPointer: { type: 'shadow' },
        backgroundColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        formatter: (params: any) => this.getCustomTooltip(params),
      },
      grid: {
        left: '2%',
        right: '5%',
        bottom: '0%',
        top: '-12%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: [''],
        axisLabel: { show: false },
      },
    };
  }

  getCustomTooltip(params: any): string {
    const visibleParams = params.filter((item: any) => item.seriesName !== 'scale');
    return visibleParams.map((item: any) => `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1; display: flex; align-items: center;">
          ${item.marker} ${item.seriesName}:
        </div>
        &nbsp;
        <div style="flex: 1; text-align: right;">
          <strong>${item.value.toLocaleString()}</strong>
        </div>
      </div>`).join('');
  }

  updateChart(): void {
    this.chartOption = {
      ...this.getBaseChartOptions(),
      series: this.getSeriesOptions(),
    };
  }

  getSeriesOptions(): SeriesOption[] {
    return [
      {
        name: 'Total Income',
        type: 'bar',
        data: [this.totalIncome],
        barWidth: this.barWidth,
        itemStyle: {
          color: this.colorService.isDarkMode() ? '#A0CA7E' : 'rgb(157, 202, 127)', // Green for income
          borderRadius: [0, 100, 100, 0],
        },
      },
      {
        name: 'Total Expense',
        type: 'bar',
        data: [this.totalExpense],
        barWidth: this.barWidth,
        itemStyle: {
          color: this.colorService.isDarkMode() ? '#E07A6A' : 'rgb(222, 110, 106)', // Red for expense
          borderRadius: [0, 100, 100, 0],
        },
      },
      {
        name: 'scale',
        type: 'bar',
        data: [this.dataService.incomeExpenseScaleValue()],
        barWidth: '0.1%',
        itemStyle: { color: 'rgba(0,0,0,0)' },
      },
    ];
  }
}
