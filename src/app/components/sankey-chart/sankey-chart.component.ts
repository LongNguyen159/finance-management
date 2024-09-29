import { Component, inject, OnInit } from '@angular/core';
import { SankeyLink } from '../models';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService } from '../data.service';


interface SankeyNode {
  name: string;
}

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


  constructor() {
  }

  ngOnInit(): void {
    // const nodes = this.generateNodesFromLinks(this.dataService.userDefinedLinks)

    // this.sankeyOption = {
    //   tooltip: {
    //     trigger: 'item',
    //     triggerOn: 'mousemove'
    //   },
    //   series: [
    //     {
    //       type: 'sankey',
    //       data: nodes, // Auto-generated nodes
    //       links: this.dataService.userDefinedLinks, // User-defined links
    //       emphasis: { focus: 'adjacency' },
    //       label: { fontSize: 12 },
    //       nodeGap: 15,
    //       lineStyle: { color: 'gradient', curveness: 0.5 }
    //     }
    //   ]
    // }
  }


  generateNodesFromLinks(links: SankeyLink[]): SankeyNode[] {
    const nodeSet = new Set<string>();
  
    links.forEach(link => {
      nodeSet.add(link.source);
      nodeSet.add(link.target);
    });
  
    return Array.from(nodeSet).map(name => ({ name }))
  }
}
