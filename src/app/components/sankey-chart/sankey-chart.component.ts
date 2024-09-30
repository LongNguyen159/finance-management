import { Component, inject, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService } from '../data.service';


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


  constructor() {
  }

  ngOnInit(): void {
    this.updateSankeyChart()
  }


  updateSankeyChart() {
    const { nodes, links, remainingBalance } = this.dataService.processInputData(this.dataService.userDefinedLinks);
    this.remainingBalance = remainingBalance

    this.sankeyOption = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove'
      },
      series: [
        {
          type: 'sankey',
          data: nodes.map(node => ({ name: node.name })),
          links: links,
          emphasis: { focus: 'adjacency' },
          label: { fontSize: 12 },
          nodeGap: 15,
          lineStyle: { color: 'gradient', curveness: 0.5 }
        }
      ]
    }
  }
}
