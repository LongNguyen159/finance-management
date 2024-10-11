import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService, ProcessedOutputData } from '../data.service';
@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss'
})
export class PieChartComponent implements OnChanges {
  dataService = inject(DataService)
  @Input() pieChartData: any[] = []
  @Input() chartTitle: string = ''
  @Input() chartDescription: string = ''

  @Input() totalExpenses: number = -1
  @Input() totalIncome: number = -1

  pieOption: EChartsOption = {}
  pieMergeOption: EChartsOption = {}

  constructor() {
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['pieChartData']) {
      this.pieOption = {
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            // Use toLocaleString to format the value
            const value = params.data.value.toLocaleString(); // Format the value
            return `${params.name}: <b>${value} (${params.percent}%)</b>`; // Bold the params.name
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
        },
        toolbox: {
          right: 20,
          feature: {
            saveAsImage: {
              name: `${this.chartTitle}_${this.dataService.getTodaysDate()}`
            },
          },
        },
        series: [
          {
            type: 'pie',
            radius: '50%',
            data: this.pieChartData,
            emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
            label: {
              formatter: (params: any) =>  {
                return `${params.name}: ${params.value.toLocaleString()} (${params.percent.toLocaleString()}%)`;
              },
              fontSize: 12
            }
          }
        ]
      }
    }
  }
}
