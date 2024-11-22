import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, effect, inject, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { EChartsOption, EChartsType, SeriesOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService } from '../../../services/data.service';
import { ColorService } from '../../../services/color.service';
import { CurrencyService } from '../../../services/currency.service';
import { BaseChartComponent } from '../../../base-components/base-chart/base-chart.component';

@Component({
  selector: 'app-income-expense-ratio-chart',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule],
  providers: [
    provideEcharts(),
    CurrencyPipe
  ],
  templateUrl: './income-expense-ratio-chart.component.html',
  styleUrls: ['./income-expense-ratio-chart.component.scss']
})
export class IncomeExpenseRatioChartComponent extends BaseChartComponent implements OnChanges, OnDestroy {
  @Input() totalIncome: number = 0;
  @Input() totalExpense: number = 0;

  dataService = inject(DataService)
  colorService = inject(ColorService)
  currencyPipe = inject(CurrencyPipe)
  currencyService = inject(CurrencyService)

  barWidth: string = '10%'

  /** Chart Options & Update Option. */
  chartOption: EChartsOption = this.getBaseChartOptions();
  chartMerge: EChartsOption = {}

  constructor() {
    super()

    /** Update chart on Signal changes */
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
        borderColor: this.colorService.isDarkMode() ? '#484753' : '#E0E6F1',
        borderWidth: 2,
        borderRadius: 12,
        padding: [10, 16],
        position: function (pos, params, dom, rect, size) {
          // tooltip will be fixed on the right if mouse hovering on the left,
          // and on the left if hovering on the right.
          var obj: any = {top: 60};
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
          return obj;
        },
        axisPointer: { type: 'none' },
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
          <strong>${this.currencyPipe.transform(item.value, this.currencyService.getSelectedCurrency())}</strong>
        </div>
      </div>`).join('');
  }

  /** Use merge option to avoid reinitialising the chart.
   * Reinitialising the chart will raise warning "There is a chart instance already initialised in the DOM".
   */
  updateChart(): void {
    this.chartMerge = {
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
          color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode, // Green for income
          borderRadius: [0, 100, 100, 0],
        },
      },
      {
        name: 'Total Expense',
        type: 'bar',
        data: [this.totalExpense],
        barWidth: this.barWidth,
        itemStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode, // Red for expense
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
