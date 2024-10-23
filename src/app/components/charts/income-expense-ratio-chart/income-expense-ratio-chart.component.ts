import { CommonModule } from '@angular/common';
import { Component, effect, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
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
  styleUrl: './income-expense-ratio-chart.component.scss'
})
export class IncomeExpenseRatioChartComponent implements OnChanges {
  @Input() totalIncome: number = 0;
  @Input() totalExpense: number = 0;

  dataService = inject(DataService)
  colorService = inject(ColorService)

  constructor() {
    effect(() => {
      this.scaleChart()
    })
  }

  barWidth: string = '10%'
  chartOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
      textStyle: {
        color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
      },
      formatter: (params: any) => {
        const visibleParams = params.filter((item: any) => item.seriesName !== 'scale')
        let tooltip = ''
        visibleParams.forEach((item: any) => {
          tooltip += `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1; display: flex; align-items: center;">
              ${item.marker} ${item.seriesName}:
            </div>
            &nbsp;
            <div style="flex: 1; text-align: right;">
              <strong>${item.value}</strong>
            </div>
          </div>`;
        });
        return tooltip
      },
    },
    grid: {
      left: '2%',
      right: '5%',
      bottom: '0%',
      top: '-12%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: [''],
      axisLabel: {
        show: false
      }
    },
  };

  mergeOption: EChartsOption
  
  ngOnChanges(changes: SimpleChanges): void {
    if(changes && changes['totalIncome'] || changes['totalExpense']) {
      this.updateChart();
    }
  }



  updateChart() {
    this.mergeOption = 
    {
      series: [
        {
          name: 'Total Income',
          type: 'bar',
          data: [this.totalIncome],
          barWidth: this.barWidth,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#A0CA7E' : 'rgb(157, 202, 127)',  // Green for income
            borderRadius: [0, 100, 100, 0]
          }
        },
        {
          name: 'Total Expense',
          type: 'bar',
          data: [this.totalExpense],
          barWidth: this.barWidth,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#E07A6A' : 'rgb(222, 110, 106)',  // Red for expense
            borderRadius: [0, 100, 100, 0]
          }
        },
      ]
    }
    this.chartOption = { ...this.chartOption, ...this.mergeOption }
  }


  scaleChart() {
    this.mergeOption = {
      series: [
        {
          name: 'Total Income',
          type: 'bar',
          data: [this.totalIncome],
          barWidth: this.barWidth,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#A0CA7E' : 'rgb(157, 202, 127)',  // Green for income
            borderRadius: [0, 100, 100, 0]
            
          }
        },
        {
          name: 'Total Expense',
          type: 'bar',
          data: [this.totalExpense],
          barWidth: this.barWidth,
          itemStyle: {
            color: this.colorService.isDarkMode() ? '#E07A6A' : 'rgb(222, 110, 106)',  // Red for expense
            borderRadius: [0, 100, 100, 0]
          }
        },
        {
          name: 'scale',
          type: 'bar',
          data: [this.dataService.incomeExpenseScaleValue()],
          barWidth: '0.1%',
          itemStyle: {
            color: 'rgba(0,0,0,0)',
          },
        },
      ]
    }
    this.chartOption = { ...this.chartOption, ...this.mergeOption }
  }
}
