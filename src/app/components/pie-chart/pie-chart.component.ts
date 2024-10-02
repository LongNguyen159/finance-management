import { Component, inject, OnInit } from '@angular/core';
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
export class PieChartComponent implements OnInit {
  dataService = inject(DataService)
  pieOption: EChartsOption = {}
  pieSeriesData: any[] = []

  constructor() {
  }

  ngOnInit(): void {
    this.dataService.getProcessedData().subscribe((data: ProcessedOutputData) => {
      this.pieSeriesData = data.pieData

      console.log('pie chart updated')

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
        series: [
          {
            type: 'pie',
            radius: '50%',
            data: this.pieSeriesData,
            emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
            label: { formatter: '{b}: {c} ({d}%)', fontSize: 12 }
          }
        ]
      };

    })
    

    
  }
}
