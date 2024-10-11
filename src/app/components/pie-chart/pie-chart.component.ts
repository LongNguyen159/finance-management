import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService, ProcessedOutputData } from '../data.service';
import { ColorService } from '../../services/color.service';
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
  colorService = inject(ColorService)
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
      this.updateChart()
    }
  }

  updateChart() {
    this.pieOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: this.colorService.isDarkmode? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.colorService.isDarkmode? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        formatter: (params: any) => {
          // Use toLocaleString to format the value
          const value = params.data.value.toLocaleString(); // Format the value
          return `${params.name}: <b>${value} (${params.percent}%)</b>`; // Bold the params.name
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: {
          color: this.colorService.isDarkmode? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        }
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
            fontSize: 12,
            color: this.colorService.isDarkmode ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary
          }
        }
      ]
    }
  }
}
