import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService, ProcessedOutputData } from '../../services/data.service';
import { SankeyData } from '../models';

@Component({
  selector: 'app-demo-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './demo-chart.component.html',
  styleUrl: './demo-chart.component.scss'
})
export class DemoChartComponent {

  chartOption: EChartsOption = {
    series: [
      {
        // nodeAlign: 'left',
        type: 'sankey',
        data: [
          {
              "name": "Main Salary",
              "value": 1200
          },
          {
              "name": "Housing",
              "value": 590
          },
          {
              "name": "Rent",
              "value": 500
          },
          {
              "name": "WiFi",
              "value": 40
          },
          {
              "name": "Groceries",
              "value": 300
          }
      ],
        links: [
          {
              "source": "Main Salary",
              "target": "Housing",
              "value": 590
          },
          {
              "source": "Housing",
              "target": "Rent",
              "value": 500
          },
          {
              "source": "Housing",
              "target": "WiFi",
              "value": 40
          },
          {
              "source": "Main Salary",
              "target": "Groceries",
              "value": 300
          }
      ],
        emphasis: { focus: 'adjacency' },
        label: { fontSize: 0, show: false },
        nodeGap: 15,
        lineStyle: { color: 'gradient', curveness: 0.5 },
      }
    ]
  }
}
