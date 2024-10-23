import { CommonModule } from '@angular/common';
import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';

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
export class IncomeExpenseRatioChartComponent implements OnInit, OnChanges {
  totalIncome = 1250;
  totalExpense = 800;
  barWidth: string = '10%'
  chartOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
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
    series: [
      {
        name: 'Total Income',
        type: 'bar',
        data: [this.totalIncome],
        barWidth: this.barWidth,
        itemStyle: {
          color: 'rgb(157, 202, 127)',  // Green for income
          borderRadius: [0, 100, 100, 0]
        }
      },
      {
        name: 'Total Expense',
        type: 'bar',
        data: [this.totalExpense],
        barWidth: this.barWidth,
        itemStyle: {
          color: 'rgb(222, 110, 106)',  // Red for expense
          borderRadius: [0, 100, 100, 0]
        }
      }
    ]
  };
  

  
  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges): void {
    
  }
}
