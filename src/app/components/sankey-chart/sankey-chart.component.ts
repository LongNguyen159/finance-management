import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
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
export class SankeyChartComponent implements OnChanges {

  @Input() sankeyData: SankeyData
  @Input() remainingBalance: string = '-'

  dataService = inject(DataService)

  sankeyOption: EChartsOption = {}
  mergeOption: EChartsOption = {}

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['sankeyData']) {
      this.updateSankeyChart()
    }
  }


  updateSankeyChart() {
    console.log('sankey chart updated')
    this.sankeyOption = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
      },
      toolbox: {
        right: 20,
        feature: {
          saveAsImage: {},
        },
      },
      series: [
        {
          nodeAlign: 'left',
          type: 'sankey',
          data: this.sankeyData.nodes,
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
