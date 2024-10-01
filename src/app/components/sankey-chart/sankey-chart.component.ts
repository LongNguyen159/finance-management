import { Component, inject, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService, ProcessedOutputData } from '../data.service';
import { SankeyData } from '../models';


@Component({
  selector: 'app-sankey-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './sankey-chart.component.html',
  styleUrl: './sankey-chart.component.scss'
})
export class SankeyChartComponent implements OnInit{
  dataService = inject(DataService)

  sankeyOption: EChartsOption = {}

  remainingBalance: string = ''
  sankeyData: SankeyData = {
    nodes: [],
    links: []
  }


  constructor() {
  }

  ngOnInit(): void {
    this.dataService.getProcessedData().subscribe((data: ProcessedOutputData) => {
      this.sankeyData = data.sanekeyData
      this.remainingBalance = data.remainingBalance
      this.updateSankeyChart()
    })
  }


  updateSankeyChart() {
    console.log('sankey chart updated')
    this.sankeyOption = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove'
      },
      series: [
        {
          type: 'sankey',
          data: this.sankeyData.nodes.map(node => ({ name: node.name, value: node.totalValue })),
          links: this.sankeyData.links,
          emphasis: { focus: 'adjacency' },
          label: { fontSize: 12 },
          nodeGap: 15,
          lineStyle: { color: 'gradient', curveness: 0.5 }
        }
      ]
    }
  }
}
