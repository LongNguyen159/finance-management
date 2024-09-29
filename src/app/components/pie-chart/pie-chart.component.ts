import { Component, inject, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService } from '../data.service';
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

  constructor() {
  }

  ngOnInit(): void {
    const expenseData = this.dataService.userDefinedLinks
      .filter(link => link.type == 'expense' || link.type == 'tax') // Filter expense links
      .map(link => ({ name: link.target, value: link.value })); // Map to name and value


    this.pieOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)' // Shows label, value, and percentage
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: expenseData,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
          label: { formatter: '{b}: {c} ({d}%)', fontSize: 12 }
        }
      ]
    };
  }
}
