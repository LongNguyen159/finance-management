import { Component, effect, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { Budget, ExpenseCategory, expenseCategoryDetails } from '../../models';
import { BaseChartComponent } from '../../../base-components/base-chart/base-chart.component';

@Component({
  selector: 'app-budget-radar-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './budget-radar-chart.component.html',
  styleUrl: './budget-radar-chart.component.scss'
})
export class BudgetRadarChartComponent extends BaseChartComponent implements OnChanges {
  @Input() actualSpending: { category: ExpenseCategory, value: number }[] = []
  @Input() budget: Budget[] = []


  options: EChartsOption = this.getBaseOptions()
  mergeOptions: EChartsOption = {}
  SCALE_FACTOR = 1.25

  constructor() {
    super()
    effect(() => {
      this.updateChart()
    })
  }

  getBaseOptions(): EChartsOption {
    return {
      tooltip: {},
      legend: {
        top: 0,
        textStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
      },
      radar: {},
      series: []
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['budget'] || changes['actualSpending']) {
      this.updateChart()
    }
  }
  

  updateChart() {
    if (this.budget.length == 0 || this.actualSpending.length == 0) {
      return
    }

    /** Generate indicator array based on actual spending.
     * Only include the categories that are in actual spending.
     * 
     * Indicator has a 'max' value, this value should be a bit larger than our maximum value to leave room.
     * 
     * If max value is not set, the radar chart will be scaled based on the maximum value in the data.
     */
    const indicators = this.actualSpending
      .filter(a => a.value > 0 && this.budget.some(b => b.category === a.category && b.value > 0))
      .map(a => {
        const budget = this.budget.find(b => b.category === a.category);
        const max = budget ? Math.max(budget.value, a.value) : a.value;
        const paddedMax = max * this.SCALE_FACTOR; // Add 20% padding
        return { name: expenseCategoryDetails[a.category].label, min: 0, max: undefined};
      });

    const actualValues = this.actualSpending
      .filter(a => a.value > 0 && this.budget.some(b => b.category === a.category && b.value > 0))
      .map(a => a.value);

    const budgetValues = this.actualSpending
      .filter(a => a.value > 0 && this.budget.some(b => b.category === a.category && b.value > 0))
      .map(a => {
        const budget = this.budget.find(b => b.category === a.category);
        return budget ? budget.value : 0;
      });


    this.mergeOptions = {
      ...this.getBaseOptions(),
      radar: {
        indicator: indicators,
        shape: 'circle',
        scale: true,
        axisLine: {
          lineStyle: {
            color: this.colorService.isDarkMode() ? 'rgba(204, 204, 204, 0.7)' : 'rgba(144, 144, 144, 1)',
          }
        },
        splitLine: {
          lineStyle: {
            color: [
              'rgba(144, 144, 144, 0.1)',
              'rgba(144, 144, 144, 0.2)',
              'rgba(144, 144, 144, 0.4)',
              'rgba(144, 144, 144, 0.6)',
              'rgba(144, 144, 144, 0.8)',
              'rgba(144, 144, 144, 1)'
            ].reverse()
          }
        },
      },
      series: [
        {
          type: 'radar',
          symbol: 'none',
          data: [
            {
              value: actualValues,
              name: 'Actual Spending',
              itemStyle: {
                color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode,
              },
              lineStyle: {
                width: 2,
                color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode,
                cap: 'round'
              },
              areaStyle: {
                color: this.colorService.isDarkMode() ? this.colorService.redDarkMode : this.colorService.redLightMode,
                opacity: 0.7
              },
            },

            {
              value: budgetValues,
              name: 'Budget',

              itemStyle: {
                color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode,
              },
              lineStyle: {
                width: 2,
                color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode,
              },
              areaStyle: {
                color: this.colorService.isDarkMode() ? this.colorService.greenDarkMode : this.colorService.greenLightMode,
                opacity: 0.5
              },
            },
            
          ],
        }
      ]
    };
  }
}
